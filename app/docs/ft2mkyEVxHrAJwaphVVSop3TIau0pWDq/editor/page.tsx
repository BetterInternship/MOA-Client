/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
<<<<<<< HEAD
 * @ Modified time: 2025-11-07 15:30:02
=======
 * @ Modified time: 2025-11-07 14:10:13
>>>>>>> develop
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
import { CheckCircle, Download, PlusCircle, Redo2Icon, Upload, X } from "lucide-react";
import {
  IFormField,
  IFormMetadata,
  IFormSignatory,
  IFormSubscriber,
  PARTIES,
  SOURCES,
} from "@betterinternship/core/forms";
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
import { FieldRegistryEntry, RegisterFormSchemaDto } from "@/app/api";

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
  const { data: fieldRegistry } = useFormsControllerGetFieldRegistry();

  // The current highlight and its transform; only need one for coordinates
  const [loading, setLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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

  // Refreshes the fields so we don't have to do it one by one
  const handleFieldsRefresh = async () => {
    setRefreshing(true);

    // Util for refreshing field
    const fieldRefresher = async (oldField: IFormField) => {
      const fieldId = fieldRegistry?.fields.find(
        (f) => `${f.name}:${f.preset}` === oldField.field
      )?.id;
      if (!fieldId) return;

      const { field } = await formsControllerGetFieldFromRegistry({ id: fieldId });
      const { id: _id, name: _name, preset: _preset, ...rest } = field;
      const fieldFullName = `${field.name}:${field.preset}`;
      const newField = {
        ...oldField,
        ...rest,
        field: fieldFullName,
        validator: field.validator ?? "",
        prefiller: field.prefiller ?? "",
        tooltip_label: field.tooltip_label ?? "",
        h: 10,
      };

      return newField;
    };

    // Refresh all fields
    const newFields = await Promise.all(fields.map(fieldRefresher)).then((fs) =>
      fs.filter((f) => f !== undefined)
    );
    setFields(newFields);
    setRefreshing(false);
  };

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
  const removeField = (key: number) => {
    setHighlight(null);
    setFields(fields.filter((f, i) => i !== key));
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
          initialDocumentLabel={formMetadata?.label ?? null}
          handleFieldsRefresh={() => void handleFieldsRefresh()}
          refreshing={refreshing}
          initialRequiredParties={formMetadata?.required_parties ?? []}
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
  fieldRegistry,
  updateContact,
}: {
  initialContactDetails: IFormSubscriber | IFormSignatory;
  fieldRegistry: FieldRegistryEntry[];
  updateContact: (field: Partial<IFormSubscriber> | Partial<IFormSignatory>) => void;
}) => {
  const [fieldFullName, setFieldFullName] = useState<string>();
  const [contactDetails, setContactDetails] = useState<IFormSubscriber | IFormSignatory>(
    initialContactDetails
  );

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

  // Select a field
  const handleSelectField = (id: string) => {
    setFieldFullName(id);
    handleChangeFactory("field")(id);
  };

  return (
    <div className="flex flex-col gap-2 rounded-[0.25em] border border-gray-300 p-2">
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        {"field" in initialContactDetails && (
          <>
            <Badge>Field Placement</Badge>
            <Autocomplete
              value={fieldFullName}
              inputClassName="h-7 py-1 text-xs"
              placeholder="Select field..."
              options={fieldRegistry.map((f) => ({
                id: `${f.name}:${f.preset}`,
                name: `${f.name}:${f.preset}`,
              }))}
              setter={(id) => id && handleSelectField(id)}
            />
          </>
        )}
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
  fieldDetails,
  fieldRegistry,
  selected,
  updateField,
  removeField,
  index,
}: {
  fieldDetails: IFormField;
  fieldRegistry: { id: string; name: string; preset: string }[];
  selected: boolean;
  updateField: (field: Partial<IFormField>) => void;
  removeField: (key: number) => void;
  index: number;
}) => {
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

    updateField(newField);
  };

  // Removes field from the drafted schema
  const handleRemoveField = () => {
    removeField(index);
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
          onClick={handleRemoveField}
        >
          <X></X>
        </Button>
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        <Badge>Display Label</Badge>
        <Input
          value={fieldDetails.label}
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
          options={SOURCES.map((s) => ({ id: s, name: s }))}
          setter={(id) => id && handleChangeFactory("source")(id)}
        />
        <Badge>Postion X</Badge>
        <Input
          value={fieldDetails.x}
          type="number"
          className="h-7 py-1 text-xs"
          defaultValue={fieldDetails.x}
          onChange={handleChangeFactory("x")}
        />
        <Badge>Position Y</Badge>
        <Input
          value={fieldDetails.y}
          type="number"
          className="h-7 py-1 text-xs"
          defaultValue={fieldDetails.y}
          onChange={handleChangeFactory("y")}
        />
        <Badge>Width</Badge>
        <Input
          value={fieldDetails.w}
          type="number"
          className="h-7 py-1 text-xs"
          defaultValue={fieldDetails.w}
          onChange={handleChangeFactory("w")}
        />
        <Badge>Page</Badge>
        <Input
          value={fieldDetails.page}
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
  initialDocumentLabel,
  initialSubscribers,
  initialSignatories,
  initialRequiredParties,
  setDocumentUrl,
  addDocumentField,
  editDocumentField,
  removeDocumentField,
  handleFieldsRefresh,
  refreshing,
}: {
  documentUrl: string | null;
  fieldTransform: { x: number; y: number; w: number; h: number; page: number };
  documentFields: IFormField[];
  initialDocumentName: string | null;
  initialDocumentLabel: string | null;
  initialSubscribers: IFormSubscriber[];
  initialSignatories: IFormSignatory[];
  initialRequiredParties: string[];
  setDocumentUrl: (documentUrl: string) => void;
  addDocumentField: (field: IFormField) => void;
  editDocumentField: (key: number) => (field: Partial<IFormField>) => void;
  removeDocumentField: (key: number) => void;
  handleFieldsRefresh: () => void;
  refreshing: boolean;
}) => {
  // Allows us to click the input without showing it
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: fieldRegistry } = useFormsControllerGetFieldRegistry();
  const { openModal, closeModal } = useModal();
  const [documentName, setDocumentName] = useState<string>(initialDocumentName ?? "Select file");
  const [documentLabel, setDocumentLabel] = useState<string>(initialDocumentLabel ?? "Form");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [fieldPreviews, setFieldPreviews] = useState<React.ReactNode[]>([]);
  const [subscribers, setSubscribers] = useState<(IFormSubscriber & { id: string })[]>([]);
  const [signatories, setSignatories] = useState<(IFormSignatory & { id: string })[]>([]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const keyedDocumentFields = useMemo(
    () => documentFields.map((field) => ({ id: Math.random().toString(), ...field })),
    [selectedFieldKey, documentFields, fieldRegistry]
  );

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
      source: "manual",
      party: "student",
      shared: true,
    });
  }, [addDocumentField]);

  // Adds a new subscriber to the schema
  const handleSubscriberAdd = () => {
    setSubscribers([
      {
        id: Math.random().toString(),
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
        id: Math.random().toString(),
        name: "",
        honorific: "",
        title: "",
        email: "",
        field: "",
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
      if (!field.party) return alert(`${field.field} is missing its party.`);
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
        subscribers={subscribers.map((s) => {
          const { id: _id, ...rest } = s;
          return rest;
        })}
        signatories={signatories.map((s) => {
          const { id: _id, ...rest } = s;
          return rest;
        })}
        documentFields={keyedDocumentFields.map((f) => {
          const { id: _id, ...rest } = f;
          return rest;
        })}
        documentLabelPlaceholder={documentLabel}
        documentNamePlaceholder={documentName}
        documentFile={documentFile}
        close={() => closeModal()}
        initialRequiredParties={initialRequiredParties}
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
    if (selectedFieldKey === null) return keyedDocumentFields.toReversed();
    return [
      keyedDocumentFields.find((field) => field.id === selectedFieldKey)!,
      ...keyedDocumentFields.filter((f) => f.id !== selectedFieldKey).toReversed(),
    ];
  }, [selectedFieldKey, keyedDocumentFields, fieldRegistry]);

  // Refresh the ui of the fields
  const refreshFieldPreviews = () => {
    const fieldPreviews = [];
    const fieldPreviewContainers =
      document.querySelectorAll(".PdfHighlighter__highlight-layer") ?? [];

    for (let i = 0; i < keyedDocumentFields.length; i++) {
      const field = keyedDocumentFields[i];
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
            selected={field.id === selectedFieldKey}
            onClick={() => setSelectedFieldKey(field.id)}
          />,
          fieldPreviewContainer
        )
      );
    }

    setFieldPreviews(fieldPreviews);
  };

  // Give them ids hopefully
  useEffect(() => {
    setSubscribers(initialSubscribers.map((s) => ({ id: Math.random().toString(), ...s })));
    setSignatories(initialSignatories.map((s) => ({ id: Math.random().toString(), ...s })));
  }, []);

  // Updates the field previews
  // (we have to touch the DOM directly for this to go under the hoods of the lib we're using)
  useEffect(() => {
    refreshFieldPreviews();
    return () => setFieldPreviews([]);
  }, [selectedFieldKey, keyedDocumentFields, fieldRegistry]);

  // Make sure to set the file when it's specified in the parent
  useEffect(() => {
    if (!documentUrl) return;
    void loadPdfAsFile(documentUrl, documentName).then((file) => setDocumentFile(file));
  }, [documentUrl]);

  // Handle editing subs and sigs
  const editSubscriber = (key: number) => (newSubscriber: Partial<IFormSubscriber>) => {
    setSubscribers([
      ...subscribers.slice(0, subscribers.length - key),
      { ...subscribers[subscribers.length - key], ...newSubscriber },
      ...subscribers.slice(subscribers.length - key + 1),
    ]);
  };

  // Edit signatories
  const editSignatory = (key: number) => (newSignatory: Partial<IFormSignatory>) => {
    setSignatories([
      ...signatories.slice(0, signatories.length - key),
      { ...signatories[signatories.length - key], ...newSignatory },
      ...signatories.slice(signatories.length - key + 1),
    ]);
  };

  // Remove subscriber
  const removeSubscriber = (key: number) => {
    setSubscribers([
      ...subscribers.slice(0, subscribers.length - key),
      ...subscribers.slice(subscribers.length - key + 1),
    ]);
  };

  // Remove signatory
  const removeSignatory = (key: number) => {
    setSignatories([
      ...signatories.slice(0, signatories.length - key),
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
          <Button
            variant="outline"
            scheme="supportive"
            onClick={handleFileRegister}
            disabled={refreshing}
          >
            <CheckCircle />
            Register File
          </Button>
        )}
        {documentFile && (
          <Button
            variant="outline"
            scheme="supportive"
            onClick={() => handleFieldsRefresh()}
            disabled={refreshing}
          >
            <Redo2Icon />
            {refreshing ? "Refreshing..." : "Refresh Fields"}
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
            {sortedDocumentFields
              .filter((f) => !!f)
              .map((field) => (
                <FieldEditor
                  key={field.id}
                  index={keyedDocumentFields.indexOf(field)}
                  selected={field?.id === selectedFieldKey}
                  updateField={editDocumentField(keyedDocumentFields.indexOf(field))}
                  fieldRegistry={fieldRegistry?.fields ?? []}
                  fieldDetails={field}
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
              <div className="flex flex-row gap-2">
                <ContactEditor
                  key={subscriber.id}
                  initialContactDetails={subscriber}
                  updateContact={editSubscriber(subscribers.length - i)}
                  fieldRegistry={fieldRegistry?.fields.filter((f) => f.type === "signature") ?? []}
                />
                <Button
                  className="h-7 w-7"
                  scheme="destructive"
                  variant="outline"
                  onClick={() => removeSubscriber(subscribers.length - i)}
                >
                  <X></X>
                </Button>
              </div>
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
              <div className="flex flex-row gap-2">
                <ContactEditor
                  key={signatory.id}
                  initialContactDetails={signatory}
                  updateContact={editSignatory(signatories.length - i)}
                  fieldRegistry={fieldRegistry?.fields.filter((f) => f.type === "signature") ?? []}
                />
                <Button
                  className="h-7 w-7"
                  scheme="destructive"
                  variant="outline"
                  onClick={() => removeSignatory(signatories.length - i)}
                >
                  <X></X>
                </Button>
              </div>
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
  documentLabelPlaceholder,
  documentFields,
  documentFile,
  subscribers,
  signatories,
  initialRequiredParties,
  close,
}: {
  documentNamePlaceholder: string;
  documentLabelPlaceholder: string;
  documentFields: IFormField[];
  documentFile: File;
  subscribers: IFormSubscriber[];
  signatories: IFormSignatory[];
  initialRequiredParties: string[];
  close: () => void;
}) => {
  const [documentName, setDocumentName] = useState(documentNamePlaceholder);
  const [documentLabel, setDocumentLabel] = useState(documentLabelPlaceholder);
  const [requiredParties, setRequiredParties] = useState<string>(initialRequiredParties.join(","));
  const [submitting, setSubmitting] = useState(false);

  // Constructs the latest metadata given the state
  const formMetadataDraft: IFormMetadata & { name: string; base_document: File } = useMemo(() => {
    const requiredPartiesRaw = requiredParties.split(",").map((rp) => rp.trim());

    // Make sure required parties are unique and valid
    const requiredPartiesArray = Array.from(
      new Set(requiredPartiesRaw.filter((rp) => PARTIES.includes(rp)))
    );

    // Make signatures bigger
    const resizedFields = documentFields.map((field) => ({
      ...field,
      h: field.type === "text" ? 10 : 25,
    }));

    return {
      required_parties: requiredPartiesArray as (
        | "student"
        | "student-guardian"
        | "entity"
        | "university"
      )[],
      schema_version: SCHEMA_VERSION,
      name: documentName,
      label: documentLabel,
      base_document: documentFile,
      schema: resizedFields,
      signatories: signatories,
      subscribers: subscribers,
    };
  }, [
    documentName,
    documentLabel,
    documentFile,
    documentFields,
    requiredParties,
    subscribers,
    signatories,
  ]);

  // Handle submitting form to registry
  const handleSubmit = async () => {
    if (!documentFile) return;
    if (!documentLabel) return alert("Please specify a label for the form.");

    setSubmitting(true);
    await formsControllerRegisterForm(formMetadataDraft as unknown as RegisterFormSchemaDto);

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
        <Badge className="max-w-prose min-w-[200px]">Form Label</Badge>
        <Input
          type="text"
          className="h-7 py-1 text-xs"
          value={documentLabel}
          placeholder="Enter form label..."
          onChange={(e) => setDocumentLabel(e.target.value)}
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
