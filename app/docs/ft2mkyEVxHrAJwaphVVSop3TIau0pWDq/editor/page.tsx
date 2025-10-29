/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
 * @ Modified time: 2025-10-30 04:03:15
 * @ Description:
 *
 * This page will let us upload forms and define their schemas on the fly.
 */

"use client";

import { Loader } from "@/components/ui/loader";
import { ChangeEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AreaHighlight,
  Comment,
  Content,
  IHighlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  ViewportHighlight,
} from "react-pdf-highlighter";
import "./react-pdf-highlighter.css";
import { ScaledPosition } from "react-pdf-highlighter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, PlusCircle, Upload, X } from "lucide-react";
import { IFormContact, IFormField, IFormMetadata } from "@betterinternship/core/forms";
import { Input } from "@/components/ui/input";
import { useModal } from "@/app/providers/modal-provider";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import JsonView from "@uiw/react-json-view";
import path from "path";
import { Divider } from "@/components/ui/divider";
import { downloadJSON, loadPdfAsFile } from "@/lib/files";
import {
  formsControllerRegisterForm,
  formsControllerGetRegistryFormMetadata,
  formsControllerGetRegistryFormDocument,
  useFormsControllerGetFieldRegistry,
} from "../../../api/app/api/endpoints/forms/forms";
import { useSearchParams } from "next/navigation";
import { Autocomplete } from "@/components/ui/autocomplete";
import { formsControllerGetFieldFromRegistry } from "../../../api/app/api/endpoints/forms/forms";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormContact } from "@/app/api";

// ? Update this when migrating
const SCHEMA_VERSION = 0;

/**
 * We wrap the page around a suspense boundary to use search params.
 *
 * @component
 */
const FormEditorPage = () => {
  return (
    <Suspense>
      <FormEditorPageContent />
    </Suspense>
  );
};

/**
 * Helps us upload forms and find their coords quickly.
 * Displays the PDF and allows highlighting on pdf.
 *
 * @component
 */
const FormEditorPageContent = () => {
  const searchParams = useSearchParams();

  // The current highlight and its transform; only need one for coordinates
  const [loading, setLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<IHighlight | null>(null);
  const [fields, setFields] = useState<IFormField[]>([]);
  const [formMetadata, setFormMetadata] = useState<IFormMetadata>();
  const [fieldTransform, setFieldTransform] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    page: number;
  }>({ x: 0, y: 0, w: 0, h: 0, page: 1 });

  // Executes when user is done dragging highlight
  const onHighlightFinished = (position: ScaledPosition, content: Content) => {
    // Create new highlight
    setHighlight({
      id: "highlight",
      content: content,
      position: position,
      comment: { text: "", emoji: "" } as unknown as Comment,
    });

    // Set bounding rect to display
    const boundingRect = position.boundingRect;
    setFieldTransform({
      x: ~~boundingRect.x1,
      y: ~~boundingRect.y1,
      w: ~~boundingRect.x2 - ~~boundingRect.x1,
      h: ~~boundingRect.y2 - ~~boundingRect.y1,
      page: position.pageNumber,
    });

    // Maybe in the future you want to return a component to render per highlight
    // Do it here
    return null;
  };

  // Adds a new field to be displayed
  const addField = (field: IFormField) => {
    setHighlight(null);
    setFields([...fields, field]);
  };

  // Edit field from the array
  // This breaks the rules on how to use useState but makes up for it by calling setState() on the updated array LMAO
  const editField = (key: number) => (newField: Partial<IFormField>) => {
    setFields([...fields.slice(0, key), { ...fields[key], ...newField }, ...fields.slice(key + 1)]);
  };

  // Removes a field from the list of fields
  const removeField = (field: IFormField) => {
    setHighlight(null);
    setFields(fields.filter((f) => f !== field));
  };

  // Load the specified JSON first, if any
  useEffect(() => {
    const promises = [];
    const formName = searchParams.get("name");
    const formVersion = searchParams.get("version");
    const formVersionNumber = parseInt(formVersion ?? "nan");
    if (!formName || !formVersion || isNaN(formVersionNumber)) return setLoading(false);

    // Request the specified form metadata
    promises.push(
      formsControllerGetRegistryFormMetadata({
        name: formName,
        version: formVersionNumber,
      }).then(({ formMetadata }) => {
        // ! change this in the future
        // ! make sure to use FormMetadata class to mediate all access
        setFields(formMetadata.schema);
        setDocumentName(formMetadata.name);
        setFormMetadata(formMetadata);

        console.log(formMetadata);
      })
    );

    // Request the specified form url
    promises.push(
      formsControllerGetRegistryFormDocument({
        name: formName,
        version: formVersionNumber,
      }).then(({ formDocument }) => {
        setDocumentUrl(formDocument);
      })
    );

    // Remove loading when done processing, including fail
    void Promise.all(promises)
      .then(() => setLoading(false))
      .catch((e) => {
        alert(e);
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) return <Loader>Loading form editor...</Loader>;

  return (
    <div className="relative mx-auto h-[70vh] max-w-7xl">
      <div className="absolute flex h-full w-full flex-row justify-center gap-2">
        <Sidebar
          documentUrl={documentUrl}
          fieldTransform={fieldTransform}
          documentFields={fields}
          initialDocumentName={documentName}
          setDocumentUrl={setDocumentUrl}
          addDocumentField={addField}
          editDocumentField={editField}
          removeDocumentField={removeField}
          initialSubscribers={formMetadata?.subscribers ?? []}
          initialSignatories={formMetadata?.signatories ?? []}
        />
        {documentUrl && (
          <FormRenderer
            documentUrl={documentUrl}
            highlight={highlight}
            onHighlightFinished={onHighlightFinished}
          />
        )}
      </div>
    </div>
  );
};

/**
 * A component that just renders the document itself.
 *
 * @component
 */
const FormRenderer = ({
  documentUrl,
  highlight,
  onHighlightFinished,
}: {
  documentUrl: string;
  highlight: IHighlight | null;
  onHighlightFinished: (position: ScaledPosition, content: Content) => void;
}) => {
  // Renders a highlight object into a component
  const highlightRenderer = (highlight: ViewportHighlight, index: number) => (
    <Popup popupContent={<></>} onMouseOver={() => {}} onMouseOut={() => {}} key={index}>
      <AreaHighlight highlight={highlight} onChange={() => {}} isScrolledTo={false} />
    </Popup>
  );

  // No document to show
  if (!documentUrl) return <></>;

  return (
    <PdfLoader url={documentUrl} beforeLoad={<Loader />}>
      {(pdfDocument) => (
        <PdfHighlighter
          pdfDocument={pdfDocument}
          enableAreaSelection={(event) => true}
          onScrollChange={() => {}}
          scrollRef={() => {}}
          highlightTransform={highlightRenderer}
          highlights={highlight ? [highlight] : []}
          onSelectionFinished={onHighlightFinished}
        />
      )}
    </PdfLoader>
  );
};

/**
 * Edits contacts.
 *
 * @component
 */
const ContactEditor = ({
  initialContactDetails,
  updateContact,
}: {
  initialContactDetails: IFormContact;
  updateContact: (field: Partial<IFormContact>) => void;
}) => {
  const [contactDetails, setContactDetails] = useState<IFormContact>(initialContactDetails);

  // Handle change for any of the props of the field
  const handleChangeFactory = (property: string) => (e: ChangeEvent<HTMLInputElement> | string) => {
    const rawVal = typeof e === "string" ? e : e.target.value;
    const value = ["x", "y", "w", "h", "page"].includes(property)
      ? isNaN(parseInt(rawVal))
        ? null
        : parseInt(rawVal)
      : rawVal;
    const newContact = {
      ...contactDetails,
      [property]: value,
    };

    setContactDetails(newContact);
    updateContact(newContact);
  };

  return (
    <div className="flex flex-col gap-2 rounded-[0.25em] border border-gray-300 p-2">
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        <Badge>Contact Name</Badge>
        <Input
          placeholder="Full Name..."
          className="h-7 py-1 text-xs"
          defaultValue={contactDetails.name}
          onChange={handleChangeFactory("name")}
        />
        <Badge>Contact Honorific</Badge>
        <Input
          placeholder="Mr., Mrs., etc."
          className="h-7 py-1 text-xs"
          defaultValue={contactDetails.honorific}
          onChange={handleChangeFactory("honorific")}
        />
        <Badge>Contact Title</Badge>
        <Input
          placeholder="CEO, Practicum Coordinator, etc."
          className="h-7 py-1 text-xs"
          defaultValue={contactDetails.title}
          onChange={handleChangeFactory("title")}
        />
        <Badge>Contact Email</Badge>
        <Input
          placeholder="contact@email.com"
          className="h-7 py-1 text-xs"
          defaultValue={contactDetails.email}
          onChange={handleChangeFactory("email")}
        />
      </div>
    </div>
  );
};

/**
 * An editable field component.
 * This will probably change in the future, since a field will have more than just coords.
 *
 * @component
 */
const FieldEditor = ({
  initialFieldDetails,
  fieldRegistry,
  selected,
  updateField,
  removeField,
}: {
  initialFieldDetails: IFormField;
  fieldRegistry: { id: string; name: string; preset: string }[];
  selected: boolean;
  updateField: (field: Partial<IFormField>) => void;
  removeField: (field: IFormField) => void;
}) => {
  const [fieldDetails, setFieldDetails] = useState<IFormField>(initialFieldDetails);
  const [fieldId, setFieldId] = useState<string | null>();

  // Select a field and update details so we can use those
  const handleSelectField = async (id: string) => {
    const { field } = await formsControllerGetFieldFromRegistry({ id });
    const { id: _id, name: _name, preset: _preset, ...rest } = field;
    const fieldFullName = `${field.name}:${field.preset}`;
    const newField = {
      ...fieldDetails,
      ...rest,
      field: fieldFullName,
      validator: field.validator ?? "",
      prefiller: field.prefiller ?? "",
      tooltip_label: field.tooltip_label ?? "",
      h: 10,
    };

    setFieldDetails(newField);
    updateField(newField);
  };

  // Handle change for any of the props of the field
  const handleChangeFactory = (property: string) => (e: ChangeEvent<HTMLInputElement> | string) => {
    const rawVal = typeof e === "string" ? e : e.target.value;
    const value = ["x", "y", "w", "h", "page"].includes(property)
      ? isNaN(parseInt(rawVal))
        ? null
        : parseInt(rawVal)
      : rawVal;
    const newField = {
      ...fieldDetails,
      [property]: value,
    };

    setFieldDetails(newField);
    updateField(newField);
  };

  // Removes field from the drafted schema
  const handleRemoveField = (field: IFormField) => {
    removeField(field);
  };

  // Update field id from db
  useEffect(() => {
    const fieldFullNameList =
      fieldRegistry?.map((f) => ({ id: f.id, name: `${f.name}:${f.preset}` })) ?? [];
    const fieldId = fieldFullNameList.find((f) => f.name === fieldDetails.field)?.id;
    setFieldId(fieldId);
  }, [fieldDetails, fieldRegistry]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[0.25em] border p-2",
        selected ? "border-supportive bg-supportive/10" : "border-gray-300"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <Autocomplete
          value={fieldId}
          inputClassName="h-7 py-1 text-xs"
          placeholder="Select field..."
          options={fieldRegistry.map((f) => ({ ...f, name: `${f.name}:${f.preset}` }))}
          setter={(id) => id && void handleSelectField(id)}
        />
        <Button
          className="h-7 w-6!"
          scheme="destructive"
          variant="outline"
          onClick={() => removeField(initialFieldDetails)}
        >
          <X></X>
        </Button>
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        <Badge>Display Label</Badge>
        <Input
          placeholder="Field Display Label"
          className="h-7 py-1 text-xs"
          defaultValue={fieldDetails.label}
          onChange={handleChangeFactory("label")}
        />
        <Badge>Source</Badge>
        <Autocomplete
          value={fieldDetails.source}
          inputClassName="h-7 py-1 text-xs"
          placeholder="Select Field Source"
          options={[
            { id: "entity", name: "entity" },
            { id: "student", name: "student" },
            { id: "student-guardian", name: "student-guardian" },
            { id: "university", name: "university" },
          ]}
          setter={(id) => id && handleChangeFactory("source")(id)}
        />
        <Badge>Postion X</Badge>
        <Input
          type="number"
          className="h-7 py-1 text-xs"
          defaultValue={fieldDetails.x}
          onChange={handleChangeFactory("x")}
        />
        <Badge>Position Y</Badge>
        <Input
          type="number"
          className="h-7 py-1 text-xs"
          defaultValue={fieldDetails.y}
          onChange={handleChangeFactory("y")}
        />
        <Badge>Width</Badge>
        <Input
          type="number"
          className="h-7 py-1 text-xs"
          defaultValue={fieldDetails.w}
          onChange={handleChangeFactory("w")}
        />
        <Badge>Page</Badge>
        <Input
          type="number"
          className="h-7 py-1 text-xs"
          defaultValue={fieldDetails.page}
          onChange={handleChangeFactory("page")}
        />
      </div>
    </div>
  );
};

/**
 * A preview of what the field will look like on the document.
 *
 * @component
 */
const FieldPreview = ({
  field,
  x,
  y,
  w,
  h,
  selected,
  onClick,
}: {
  field: string;
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 border-0!",
        selected ? "bg-supportive/50!" : "bg-warning/50!"
      )}
      onClick={() => (onClick(), console.log("clicked field"))}
      onMouseDown={onClick}
      style={{
        userSelect: "auto",
        display: "inline-block",
        width: `round(var(--scale-factor) * ${w}px, 1px)`,
        height: `round(var(--scale-factor) * ${h}px, 1px)`,
        fontSize: "12px",
        transform: `translate(round(var(--scale-factor) * ${x}px, 1px), round(var(--scale-factor) * ${y}px, 1px))`,
        boxSizing: "border-box",
        cursor: "pointer",
        flexShrink: "0",
      }}
    >
      {field}
    </div>
  );
};

/**
 * The sidebar shows metadata about the pdf.
 * This is where Sherwin can add new fields and stuff.
 *
 * @component
 */
const Sidebar = ({
  documentUrl,
  fieldTransform,
  documentFields,
  initialDocumentName,
  initialSubscribers,
  initialSignatories,
  setDocumentUrl,
  addDocumentField,
  editDocumentField,
  removeDocumentField,
}: {
  documentUrl: string | null;
  fieldTransform: { x: number; y: number; w: number; h: number; page: number };
  documentFields: IFormField[];
  initialDocumentName: string | null;
  initialSubscribers: FormContact[];
  initialSignatories: FormContact[];
  setDocumentUrl: (documentUrl: string) => void;
  addDocumentField: (field: IFormField) => void;
  editDocumentField: (key: number) => (field: Partial<IFormField>) => void;
  removeDocumentField: (field: IFormField) => void;
}) => {
  // Allows us to click the input without showing it
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: fieldRegistry } = useFormsControllerGetFieldRegistry();
  const { openModal, closeModal } = useModal();
  const [documentName, setDocumentName] = useState<string>(initialDocumentName ?? "Select file");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [fieldPreviews, setFieldPreviews] = useState<React.ReactNode[]>([]);
  const [subscribers, setSubscribers] = useState<IFormContact[]>(initialSubscribers);
  const [signatories, setSignatories] = useState<IFormContact[]>(initialSignatories);
  const [selectedFieldKey, setSelectedFieldKey] = useState<number | null>(null);

  // Handle changes in file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    const url = URL.createObjectURL(file);
    setDocumentUrl(url);
    setDocumentName(path.parse(file.name).name);
    setDocumentFile(file);
  };

  // Handle when a field is added by user
  const handleFieldAdd = useCallback(() => {
    return addDocumentField({
      ...fieldTransform,
      h: 12,
      field: "",
      type: "text",
      validator: "",
      prefiller: "",
      tooltip_label: "",
      label: "",
      source: "student",
    });
  }, [addDocumentField]);

  // Adds a new subscriber to the schema
  const handleSubscriberAdd = () => {
    setSubscribers([
      {
        name: "",
        honorific: "",
        title: "",
        email: "",
      },
      ...subscribers,
    ]);
  };

  // Adds a signatory
  const handleSignatoryAdd = () => {
    setSignatories([
      {
        name: "",
        honorific: "",
        title: "",
        email: "",
      },
      ...signatories,
    ]);
  };

  // Handles when a file is registered to the db
  const handleFileRegister = useCallback(() => {
    if (!documentFile) return;

    // Check if all fields are valid
    const fieldFullNameList = fieldRegistry?.fields.map((f) => `${f.name}:${f.preset}`) ?? [];
    for (const field of documentFields) {
      if (!fieldFullNameList.includes(field.field))
        return alert(`${field.field} is not a valid field.`);
      if (!field.source) return alert(`${field.field} is missing its source.`);
      if (!field.type) return alert(`${field.field} is missing its type.`);
      if (!field.label) return alert(`${field.field} is missing its label.`);
    }

    // Check if all subscribers are okay
    for (const subscriber of subscribers) {
      if (!subscriber.name) return alert(`A subscriber entry is missing a name.`);
      if (!subscriber.email)
        return alert(`${subscriber.name} (subscriber) entry is missing an email.`);
      if (!subscriber.title)
        return alert(`${subscriber.name} (subscriber) entry is missing a title.`);
      if (!subscriber.honorific)
        return alert(`${subscriber.name} (subscriber) entry is missing an honorific.`);
    }

    for (const signatory of signatories) {
      if (!signatory.name) return alert(`A signatory entry is missing a name.`);
      if (!signatory.email)
        return alert(`${signatory.name} (signatory) entry is missing an email.`);
      if (!signatory.title) return alert(`${signatory.name} (signatory) entry is missing a title.`);
      if (!signatory.honorific)
        return alert(`${signatory.name} (signatory) entry is missing an honorific.`);
    }

    openModal(
      "register-file-modal",
      <RegisterFileModal
        subscribers={subscribers}
        signatories={signatories}
        documentFields={documentFields}
        documentNamePlaceholder={documentName}
        documentFile={documentFile}
        close={() => closeModal()}
      />,
      {
        title: "Register Form into DB?",
        allowBackdropClick: false,
        hasClose: false,
        closeOnEsc: false,
      }
    );
  }, [documentFile, documentUrl, documentFields, fieldRegistry?.fields, subscribers, signatories]);

  // Makes sure that the selected field is always shown at the top
  const sortedDocumentFields = useMemo(() => {
    if (selectedFieldKey === null) return documentFields.toReversed();
    return [
      documentFields[selectedFieldKey],
      ...documentFields.filter((f, i) => i !== selectedFieldKey).toReversed(),
    ];
  }, [selectedFieldKey, documentFields, fieldRegistry]);

  // Refresh the ui of the fields
  const refreshFieldPreviews = () => {
    const fieldPreviews = [];
    const fieldPreviewContainers =
      document.querySelectorAll(".PdfHighlighter__highlight-layer") ?? [];

    for (let i = 0; i < documentFields.length; i++) {
      const field = documentFields[i];
      const fieldPreviewContainer = fieldPreviewContainers[field.page - 1];
      if (!fieldPreviewContainer) continue;
      fieldPreviews.push(
        createPortal(
          <FieldPreview
            field={field.field}
            x={field.x}
            y={field.y}
            w={field.w}
            h={field.h}
            selected={i === selectedFieldKey}
            onClick={() => setSelectedFieldKey(i)}
          />,
          fieldPreviewContainer
        )
      );
    }

    setFieldPreviews(fieldPreviews);
  };

  // Updates the field previews
  // (we have to touch the DOM directly for this to go under the hoods of the lib we're using)
  useEffect(() => {
    refreshFieldPreviews();
    return () => setFieldPreviews([]);
  }, [selectedFieldKey, documentFields, fieldRegistry]);

  // Make sure to set the file when it's specified in the parent
  useEffect(() => {
    if (!documentUrl) return;
    void loadPdfAsFile(documentUrl, documentName).then((file) => setDocumentFile(file));
  }, [documentUrl]);

  // Handle editing subs and sigs
  const editSubscriber = (key: number) => (newSubscriber: Partial<IFormContact>) => {
    setSubscribers([
      ...subscribers.slice(0, subscribers.length - key),
      { ...subscribers[subscribers.length - key], ...newSubscriber },
      ...subscribers.slice(subscribers.length - key + 1),
    ]);
  };

  // Edit signatories
  const editSignatory = (key: number) => (newSignatory: Partial<IFormContact>) => {
    setSignatories([
      ...signatories.slice(0, signatories.length - key),
      { ...signatories[signatories.length - key], ...newSignatory },
      ...signatories.slice(signatories.length - key + 1),
    ]);
  };

  return (
    <Tabs defaultValue="fields">
      <div className="flex flex-row items-center gap-2 pt-2">
        <TabsList className="rounded-[0.33em]">
          <TabsTrigger className="rounded-[0.33em] hover:cursor-pointer" value="fields">
            Fields
          </TabsTrigger>
          <TabsTrigger className="rounded-[0.33em] hover:cursor-pointer" value="subscribers">
            Subscribers
          </TabsTrigger>
          <TabsTrigger className="rounded-[0.33em] hover:cursor-pointer" value="signatories">
            Signatories
          </TabsTrigger>
        </TabsList>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload />
          Select File
        </Button>
        {documentFile && (
          <Button variant="outline" scheme="supportive" onClick={handleFileRegister}>
            <CheckCircle />
            Register File
          </Button>
        )}
      </div>
      <div className="sidebar w-[30vw] p-4">
        <TabsContent value="fields">
          <h1 className="my-2 text-lg font-bold">"{documentName}" - Schema</h1>
          <pre className="my-2">
            x: {fieldTransform.x}, y: {fieldTransform.y}, w: {fieldTransform.w}, h:{" "}
            {fieldTransform.h}, page: {fieldTransform.page}
          </pre>
          <div className="mb-2 flex flex-row gap-2">
            {documentFile && (
              <Button variant="outline" onClick={handleFieldAdd}>
                <PlusCircle />
                Add Field
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col gap-2">
            {sortedDocumentFields.map((field) => (
              <FieldEditor
                key={JSON.stringify(field)}
                selected={documentFields.indexOf(field) === selectedFieldKey}
                updateField={editDocumentField(documentFields.indexOf(field))}
                fieldRegistry={fieldRegistry?.fields ?? []}
                initialFieldDetails={field}
                removeField={removeDocumentField}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="subscribers">
          <h1 className="my-2 text-lg font-bold">"{documentName}" - Subscribers</h1>
          <pre className="my-2">{subscribers.length} subscribers</pre>
          <div className="mb-2 flex flex-row gap-2">
            {documentFile && (
              <Button variant="outline" onClick={handleSubscriberAdd}>
                <PlusCircle />
                Add Subscriber
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col gap-2">
            {subscribers.map((subscriber, i) => (
              <ContactEditor
                key={JSON.stringify(subscriber)}
                initialContactDetails={subscriber}
                updateContact={editSubscriber(subscribers.length - i)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="signatories">
          <h1 className="my-2 text-lg font-bold">"{documentName}" - Signatories</h1>
          <pre className="my-2">{signatories.length} signatories</pre>
          <div className="mb-2 flex flex-row gap-2">
            {documentFile && (
              <Button variant="outline" onClick={handleSignatoryAdd}>
                <PlusCircle />
                Add Signatory
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col gap-2">
            {signatories.map((signatory, i) => (
              <ContactEditor
                key={JSON.stringify(signatory)}
                initialContactDetails={signatory}
                updateContact={editSignatory(signatories.length - i)}
              />
            ))}
          </div>
        </TabsContent>
      </div>
      {fieldPreviews}
    </Tabs>
  );
};

/**
 * The modal contents of the register file action.
 * Asks to confirm that u wanna register the file in the db.
 *
 * @component
 */
const RegisterFileModal = ({
  documentNamePlaceholder,
  documentFields,
  documentFile,
  subscribers,
  signatories,
  close,
}: {
  documentNamePlaceholder: string;
  documentFields: IFormField[];
  documentFile: File;
  subscribers: IFormContact[];
  signatories: IFormContact[];
  close: () => void;
}) => {
  const [documentName, setDocumentName] = useState(documentNamePlaceholder);
  const [requiredParties, setRequiredParties] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Constructs the latest metadata given the state
  const formMetadataDraft: IFormMetadata & { name: string; base_document: File } = useMemo(() => {
    const requiredPartiesRaw = requiredParties.split(",").map((rp) => rp.trim());

    // Make sure required parties are unique and valid
    const requiredPartiesArray = Array.from(
      new Set(
        requiredPartiesRaw.filter((rp) =>
          ["student", "student-guardian", "entity", "university"].includes(rp)
        )
      )
    ) as ("student" | "student-guardian" | "entity" | "university")[];

    return {
      required_parties: requiredPartiesArray,
      schema_version: SCHEMA_VERSION,
      name: documentName,
      label: "",
      base_document: documentFile,
      schema: [...documentFields],
      signatories: signatories,
      subscribers: subscribers,
    };
  }, [documentName, documentFile, documentFields, requiredParties, subscribers, signatories]);

  // Handle submitting form to registry
  const handleSubmit = async () => {
    if (!documentFile) return;

    setSubmitting(true);
    await formsControllerRegisterForm(formMetadataDraft);

    setSubmitting(false);
    close();
  };

  // Handle exporting current draft metadata
  const handleExportMetadata = () => {
    downloadJSON(`${documentName}.metadata.json`, formMetadataDraft);
  };

  return (
    <div className="flex min-w-xl flex-col gap-2">
      <div className="flex flex-row gap-2">
        <Badge className="max-w-prose min-w-[200px]">Form Name</Badge>
        <Input
          type="text"
          className="h-7 py-1 text-xs"
          value={documentName}
          placeholder="Enter form name..."
          onChange={(e) => setDocumentName(e.target.value)}
        />
      </div>
      <div className="flex flex-row gap-2">
        <Badge className="max-w-prose min-w-[200px]">Who Needs to Sign?</Badge>
        <Input
          type="text"
          className="h-7 py-1 text-xs"
          value={requiredParties}
          placeholder="Comma separated, any of: student, entity, student-guardian, university"
          onChange={(e) => setRequiredParties(e.target.value)}
        />
      </div>
      <div className="max-h-[480px] overflow-y-auto">
        <JsonView
          indentWidth={22}
          highlightUpdates={true}
          displayDataTypes={false}
          enableClipboard={false}
          value={formMetadataDraft}
        />
      </div>
      <Divider />
      <div className="flex flex-row justify-between gap-1">
        <Button variant="outline" onClick={handleExportMetadata}>
          <Download />
          Export JSON
        </Button>
        <div className="flex-1" />
        <Button
          disabled={!documentName.trim() || submitting || !documentFile}
          onClick={() => void handleSubmit()}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
        <Button disabled={submitting} scheme="destructive" variant="outline" onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default FormEditorPage;
