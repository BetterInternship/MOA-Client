/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
 * @ Modified time: 2025-11-15 14:58:14
 * @ Description:
 *
 * This page will let us upload forms and define their schemas on the fly.
 */

"use client";

import { Loader } from "@/components/ui/loader";
import { ChangeEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Download,
  Edit,
  PlusCircle,
  Redo2Icon,
  Upload,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import JsonView from "@uiw/react-json-view";
import path from "path";
import { Divider } from "@/components/ui/divider";
import { downloadJSON, loadPdfAsFile } from "@/lib/files";
import { formsControllerRegisterForm } from "../../../api/app/api/endpoints/forms/forms";
import { useRouter, useSearchParams } from "next/navigation";
import { Autocomplete } from "@/components/ui/autocomplete";
import { formsControllerGetFieldFromRegistry } from "../../../api/app/api/endpoints/forms/forms";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegisterFormSchemaDto } from "@/app/api";
import { useFieldTemplateContext } from "./field-template.ctx";
import { SCHEMA_VERSION, useFormContext } from "./form.ctx";
import {
  DocumentHighlight,
  DocumentObjectTransform,
  DocumentRenderer,
} from "@/components/docs/forms/previewer";

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
  const form = useFormContext();
  const { registry } = useFieldTemplateContext();

  // The current highlight and its transform; only need one for coordinates
  const [highlight, setHighlight] = useState<DocumentHighlight | null>(null);
  const [fieldTransform, setFieldTransform] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    page: number;
  }>({ x: 0, y: 0, w: 0, h: 0, page: 1 });

  // Executes when user is done dragging highlight
  const onHighlightFinished = (
    highlight: DocumentHighlight,
    transform: DocumentObjectTransform
  ) => {
    setHighlight(highlight);
    setFieldTransform(transform);
  };

  // Load the specified JSON first, if any
  useEffect(() => {
    const formName = searchParams.get("name");
    const formVersion = searchParams.get("version");
    const formVersionNumber = parseInt(formVersion ?? "nan");
    if (!formName || !formVersion || isNaN(formVersionNumber)) return;
    form.updateFormName(formName);
    form.updateFormVersion(formVersionNumber);
  }, [searchParams]);

  if (form.loading) return <Loader>Loading form editor...</Loader>;

  return (
    <div className="relative mx-auto mt-8 h-[83vh] max-w-7xl">
      <div className="absolute flex h-full w-full flex-row justify-center gap-2">
        <Sidebar fieldTransform={fieldTransform} />
        {form.document.url && (
          <DocumentRenderer
            documentUrl={form.document.url}
            highlights={highlight ? [highlight] : []}
            previews={form.previews}
            onHighlightFinished={onHighlightFinished}
          ></DocumentRenderer>
        )}
      </div>
    </div>
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
  initialContactDetails: IFormSubscriber | IFormSignatory;
  updateContact: (field: Partial<IFormSubscriber> | Partial<IFormSignatory>) => void;
}) => {
  const { registry: _registry } = useFieldTemplateContext();
  const registry = _registry.filter((f) => f.type === "signature");
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
              options={registry.map((f) => ({
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
  selected,
  setSelected,
  fieldIndex,
  fieldKey,
}: {
  fieldDetails: IFormField;
  selected: boolean;
  setSelected: (fieldId: string) => void;
  fieldIndex: number;
  fieldKey: string;
}) => {
  const form = useFormContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { registry } = useFieldTemplateContext();
  const [fieldTemplateId, setFieldTemplateId] = useState<string | null>();
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Scrolls the field into view on the sidebar
  const scrollIntoView = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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

    form.updateField(fieldIndex, newField);
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

    // Update field
    form.updateField(fieldIndex, newField);
    scrollIntoView();
  };

  // Removes field from the drafted schema
  const handleRemoveField = () => {
    form.removeField(fieldIndex);
  };

  // Update field id from db
  useEffect(() => {
    const fieldFullNameList =
      registry?.map((f) => ({ id: f.id, name: `${f.name}:${f.preset}` })) ?? [];
    const fieldId = fieldFullNameList.find((f) => f.name === fieldDetails.field)?.id;
    setFieldTemplateId(fieldId);
  }, [fieldDetails, registry]);

  // Check if field is in template registry
  useEffect(() => {
    if (fieldTemplateId?.trim()) setIsUsingTemplate(true);
  }, [fieldTemplateId]);

  // Scroll to field when selected
  useEffect(() => {
    if (selected) scrollIntoView();
  }, [selected]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex flex-col gap-2 border-t bg-white transition-all duration-300 hover:cursor-pointer hover:bg-gray-100",
        selected ? "border-supportive bg-supportive/10" : "border-gray-300"
      )}
    >
      <div
        className="flex flex-row items-center justify-between gap-2 p-2 px-4"
        onClick={() => (setIsOpen(!isOpen), setSelected(fieldKey))}
      >
        ({fieldDetails.page}) {fieldDetails.field}
        <div className="flex-1"></div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4"></ChevronDown>
        ) : (
          <ChevronRight className="h-4 w-4"></ChevronRight>
        )}
      </div>
      {isOpen && (
        <div className="bg-gray-100 p-4">
          <div className="mb-4 flex flex-row justify-between gap-2">
            <div className="mb-4 flex flex-row overflow-hidden rounded-[0.33em]">
              <Button
                className="h-7 rounded-none"
                scheme="secondary"
                onClick={() => setIsUsingTemplate(false)}
              >
                Define from scratch
                <Edit></Edit>
              </Button>
              <Button
                className="h-7 rounded-none"
                scheme="supportive"
                onClick={() => setIsUsingTemplate(true)}
              >
                Use a template
                <ClipboardCopy></ClipboardCopy>
              </Button>
            </div>
            <Button
              className="h-7"
              scheme="destructive"
              variant="outline"
              onClick={handleRemoveField}
            >
              Remove
              <X></X>
            </Button>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            {isUsingTemplate ? (
              <>
                <Badge className="bg-supportive border-none text-white">Template Name</Badge>
                <Autocomplete
                  value={fieldTemplateId}
                  inputClassName="h-7 py-1 text-xs text-supportive border-supportive"
                  placeholder="Choose template..."
                  options={registry.map((f) => ({ ...f, name: `${f.name}:${f.preset}` }))}
                  setter={(id) => id && void handleSelectField(id)}
                />
              </>
            ) : (
              <>
                <Badge className="border-none bg-black text-white">Field Identifier</Badge>
                <Input
                  value={fieldDetails.field}
                  placeholder="Field Identifier"
                  className="h-7 py-1 text-xs"
                  defaultValue={fieldDetails.field}
                  onChange={handleChangeFactory("field")}
                />
              </>
            )}
            <Badge>Display Label</Badge>
            <Input
              value={fieldDetails.label}
              placeholder="Field Display Label"
              className="h-7 py-1 text-xs"
              defaultValue={fieldDetails.label}
              onChange={handleChangeFactory("label")}
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
            <Badge>Horizontal Alignment</Badge>
            <Autocomplete
              value={fieldDetails.align_h ?? "center"}
              inputClassName="h-7 py-1 text-xs"
              placeholder="Horizontal alignment"
              options={[
                { id: "left", name: "left" },
                { id: "center", name: "center" },
                { id: "right", name: "right" },
              ]}
              setter={(id) => id && void handleChangeFactory("align_h")(id)}
            />
            <Badge>Vertical Alignment</Badge>
            <Autocomplete
              value={fieldDetails.align_v ?? "bottom"}
              inputClassName="h-7 py-1 text-xs"
              placeholder="Vertical alignment"
              options={[
                { id: "top", name: "top" },
                { id: "middle", name: "middle" },
                { id: "bottom", name: "bottom" },
              ]}
              setter={(id) => id && void handleChangeFactory("align_v")(id)}
            />
            {!isUsingTemplate && (
              <>
                <Badge>Source</Badge>
                <Autocomplete
                  value={fieldDetails.source}
                  inputClassName="h-7 py-1 text-xs"
                  placeholder="Select Field Source"
                  options={SOURCES.map((s) => ({ id: s, name: s }))}
                  setter={(id) => id && handleChangeFactory("source")(id)}
                />
                <Badge>Party</Badge>
                <Autocomplete
                  value={fieldDetails.party}
                  inputClassName="h-7 py-1 text-xs"
                  placeholder="Select Field Party"
                  options={PARTIES.map((s) => ({ id: s, name: s }))}
                  setter={(id) => id && handleChangeFactory("party")(id)}
                />
                <Badge>Tooltip Label</Badge>
                <Input
                  value={fieldDetails.tooltip_label}
                  className="h-7 py-1 text-xs"
                  defaultValue={fieldDetails.tooltip_label}
                  onChange={handleChangeFactory("tooltip_label")}
                />
                <Badge>Validator</Badge>
                <Input
                  value={fieldDetails.validator}
                  className="h-7 py-1 text-xs"
                  defaultValue={fieldDetails.validator}
                  onChange={handleChangeFactory("validator")}
                />
                <Badge>Prefiller</Badge>
                <Input
                  value={fieldDetails.prefiller}
                  className="h-7 py-1 text-xs"
                  defaultValue={fieldDetails.prefiller}
                  onChange={handleChangeFactory("prefiller")}
                />
              </>
            )}
          </div>
        </div>
      )}
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
  fieldTransform,
}: {
  fieldTransform: { x: number; y: number; w: number; h: number; page: number };
}) => {
  // Allows us to click the input without showing it
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useFormContext();
  const { registry } = useFieldTemplateContext();
  const { openModal, closeModal } = useModal();
  const [subscribers, setSubscribers] = useState<(IFormSubscriber & { id: string })[]>([]);
  const [signatories, setSignatories] = useState<(IFormSignatory & { id: string })[]>([]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  // Handle changes in file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    const url = URL.createObjectURL(file);
    form.updateDocument({ name: path.parse(file.name).name, url, file });
  };

  // Handle when a field is added by user
  const handleFieldAdd = () => {
    form.addField({
      ...fieldTransform,
      h: 12,
      align_h: "center",
      align_v: "bottom",
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
  };

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
    if (!form.document.file) return;

    // Check if all fields are valid
    for (const field of form.fields) {
      if (!field.field.trim()) return alert(`${field.field} has an empty field identifier.`);
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
        close={() => closeModal()}
      />,
      {
        title: "Register Form into DB?",
        allowBackdropClick: false,
        hasClose: false,
        closeOnEsc: false,
      }
    );
  }, [form.document.file, form.document.url, form.fields, registry, subscribers, signatories]);

  // Makes sure that the selected field is always shown at the top
  const sortedDocumentFields = useMemo(() => {
    const initialOrder = form.keyedFields.toReversed();
    initialOrder.sort((a, b) => a.page - b.page || a.field.localeCompare(b.field));
    return initialOrder;
  }, [selectedFieldKey, form.keyedFields, registry]);

  // Give them ids hopefully
  useEffect(() => {
    setSubscribers(
      form.formMetadata.subscribers.map((s) => ({ id: Math.random().toString(), ...s }))
    );
    setSignatories(
      form.formMetadata.signatories.map((s) => ({ id: Math.random().toString(), ...s }))
    );
  }, []);

  // Make sure to set the file when it's specified in the parent
  useEffect(() => {
    if (!form.document.url) return;
    void loadPdfAsFile(form.document.url, form.document.name).then((file) =>
      form.updateDocument({ file })
    );
  }, [form.document.url]);

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
    <Tabs className="gap-0" defaultValue="fields">
      <h1 className="my-2 text-lg font-bold tracking-tighter text-ellipsis">
        {form.document.name || "No Name Specified"}
      </h1>
      <TabsList className="rounded-b-none border-b-0">
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
      <div className="sidebar h-full w-[30vw] border border-t-0 border-gray-300 bg-white p-8">
        <TabsContent value="fields">
          <div className="p-4">
            <div className="mb-2 flex flex-row gap-2">
              {form.document.file && (
                <Button variant="outline" onClick={handleFieldAdd}>
                  <PlusCircle />
                  Add Field
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            {sortedDocumentFields
              .filter((f) => !!f)
              .map((field) => (
                <FieldEditor
                  key={field._id}
                  fieldKey={field._id}
                  fieldIndex={form.keyedFields.indexOf(field)}
                  selected={field?._id === selectedFieldKey}
                  setSelected={setSelectedFieldKey}
                  fieldDetails={field}
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="subscribers">
          <div className="p-4">
            <pre className="my-2">{subscribers.length} subscribers</pre>
            <div className="mb-2 flex flex-row gap-2">
              {form.document.file && (
                <Button variant="outline" onClick={handleSubscriberAdd}>
                  <PlusCircle />
                  Add Subscriber
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {subscribers.map((subscriber, i) => (
              <div className="flex flex-row gap-2">
                <ContactEditor
                  key={subscriber.id}
                  initialContactDetails={subscriber}
                  updateContact={editSubscriber(subscribers.length - i)}
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
          <div className="p-4">
            <pre className="my-2">{signatories.length} signatories</pre>
            <div className="mb-2 flex flex-row gap-2">
              {form.document.file && (
                <Button variant="outline" onClick={handleSignatoryAdd}>
                  <PlusCircle />
                  Add Signatory
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {signatories.map((signatory, i) => (
              <div className="flex flex-row gap-2">
                <ContactEditor
                  key={signatory.id}
                  initialContactDetails={signatory}
                  updateContact={editSignatory(signatories.length - i)}
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
      <div className="flex flex-col justify-between gap-2 pt-2">
        <div className="flex flex-row gap-2">
          <Button scheme="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            Select File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          {form.document.file && (
            <Button
              variant="outline"
              scheme="supportive"
              onClick={() => void form.refreshFields()}
              disabled={form.refreshing}
            >
              <Redo2Icon />
              {form.refreshing ? "Refreshing..." : "Refresh Fields"}
            </Button>
          )}
          {form.document.file && (
            <Button
              variant="default"
              scheme="supportive"
              onClick={handleFileRegister}
              disabled={form.refreshing}
            >
              <CheckCircle />
              Register File
            </Button>
          )}
        </div>
      </div>
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
  subscribers,
  signatories,
  close,
}: {
  subscribers: IFormSubscriber[];
  signatories: IFormSignatory[];
  close: () => void;
}) => {
  const form = useFormContext();
  const router = useRouter();
  const [documentName, setDocumentName] = useState(form.formMetadata.name ?? "");
  const [documentLabel, setDocumentLabel] = useState(form.formMetadata.label ?? "");
  const [requiredParties, setRequiredParties] = useState<string>(
    form.formMetadata.required_parties?.join(", ") ?? ""
  );
  const [submitting, setSubmitting] = useState(false);

  // Constructs the latest metadata given the state
  const formMetadataDraft: IFormMetadata & { name: string; base_document: File } = useMemo(() => {
    const requiredPartiesRaw = requiredParties.split(",").map((rp) => rp.trim());

    // Make sure required parties are unique and valid
    const requiredPartiesArray = Array.from(
      new Set(requiredPartiesRaw.filter((rp) => PARTIES.includes(rp)))
    );

    // Make signatures bigger
    const resizedFields = form.fields.map((field) => {
      const { id: _id, ...f } = {
        ...field,
        h: field.type === "text" ? 10 : 25,
        id: null, // TS is being a bitch, don't remove this line lol some type error is slipping thru
      };

      return f;
    });

    console.log("fields", form.fields);

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
      base_document: form.document.file!,
      schema: resizedFields,
      signatories: signatories,
      subscribers: subscribers,
    };
  }, [
    documentName,
    documentLabel,
    requiredParties,
    form.document,
    form.fields,
    form.formMetadata,
    subscribers,
    signatories,
  ]);

  // Handle submitting form to registry
  const handleSubmit = async () => {
    if (!form.document.file) return;
    if (!documentLabel) return alert("Please specify a label for the form.");

    // After submitting, redirect to new version
    setSubmitting(true);
    await formsControllerRegisterForm(formMetadataDraft as unknown as RegisterFormSchemaDto);
    router.push(
      `/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor?name=${form.formName}&version=${form.formVersion + 1}`
    );
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
        <Badge className="w-fit max-w-prose">Form Name</Badge>
        <Input
          type="text"
          className="h-7 py-1 text-xs"
          value={documentName}
          placeholder="Enter form name..."
          onChange={(e) => setDocumentName(e.target.value)}
        />
      </div>
      <div className="flex flex-row gap-2">
        <Badge className="w-fit max-w-prose">Form Label</Badge>
        <Input
          type="text"
          className="h-7 py-1 text-xs"
          value={documentLabel}
          placeholder="Enter form label..."
          onChange={(e) => setDocumentLabel(e.target.value)}
        />
      </div>
      <div className="flex flex-row gap-2">
        <Badge className="w-fit max-w-prose">Who Needs to Sign?</Badge>
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

        <Button disabled={submitting} scheme="destructive" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          disabled={!documentName.trim() || submitting || !form.document.file}
          onClick={() => void handleSubmit()}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default FormEditorPage;
