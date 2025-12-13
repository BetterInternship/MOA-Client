/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
 * @ Modified time: 2025-11-21 13:27:36
 * @ Description:
 *
 * This page will let us upload forms and define their schemas on the fly.
 */

"use client";

import "@/components/docs/forms/react-pdf-highlighter.css";
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
  FIELD_TYPES,
  IFormField,
  IFormMetadata,
  IFormPhantomField,
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
import {
  TabsContent,
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
} from "@/components/ui/tabs";
import { RegisterFormSchemaDto } from "@/app/api";
import { useFieldTemplateContext } from "./field-template.ctx";
import { SCHEMA_VERSION, useFormContext } from "./form.ctx";
import {
  DocumentHighlight,
  DocumentObjectTransform,
  DocumentRenderer,
} from "@/components/docs/forms/previewer";

const newParties = PARTIES.concat(["entity-representative", "entity-supervisor"]);

/**
 * We wrap the page around a suspense boundary to use search params.
 *
 * @component
 */
const FormEditorPage = () => {
  return (
    <div className="relative h-full">
      <Suspense>
        <div className="relative h-full">
          <FormEditorPageContent />
        </div>
      </Suspense>
    </div>
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
    <div className="relative mx-auto h-full w-[80vw]">
      <div className="absolute flex h-full w-full flex-row justify-center gap-2">
        <Sidebar fieldTransform={fieldTransform} />
        {form.document.url && (
          <DocumentRenderer
            documentUrl={form.document.url}
            highlights={highlight ? [highlight] : []}
            previews={form.previews}
            onHighlightFinished={onHighlightFinished}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Edits params.
 *
 * @component
 */
const ParamEditor = ({
  initialParamDetails,
  updateParam,
}: {
  initialParamDetails: { key: string; value: string };
  updateParam: (key: string, value: string) => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const [paramDetails, setParamDetails] = useState<{ key: string; value: string }>(
    initialParamDetails
  );

  return (
    <div
      className="grid grid-cols-2 gap-2 p-2 transition-all hover:cursor-pointer hover:bg-gray-100"
      onClick={() => ref.current?.focus()}
    >
      <pre className="relative flex items-center rounded-[0.33em] bg-gray-200 px-3 text-xs opacity-85 hover:cursor-pointer">
        {paramDetails.key}
        {!paramDetails.value.trim() && (
          <pre className="bg-warning text-warning-foreground text-bold absolute top-[-4] right-[-4] flex h-4 w-4 justify-center rounded-[100%] text-xs">
            !
          </pre>
        )}
      </pre>
      <div className="flex flex-row gap-2">
        <pre>=</pre>
        <Input
          ref={ref}
          placeholder="Enter value..."
          className="focus:bg-primary/20 h-7 border-gray-400 py-1 text-xs transition-all"
          defaultValue={paramDetails.value}
          onChange={(e) => (
            updateParam(paramDetails.key, e.target.value),
            setParamDetails({ ...paramDetails, value: e.target.value })
          )}
        />
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
  isPhantom,
}: {
  fieldDetails: IFormField | IFormPhantomField;
  selected: boolean;
  setSelected: (fieldId: string) => void;
  fieldIndex: number;
  fieldKey: string;
  isPhantom?: boolean;
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
    };

    if (isPhantom) form.updatePhantomField(fieldIndex, newField as unknown as IFormPhantomField);
    else form.updateField(fieldIndex, { ...newField } as IFormField);
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
    if (isPhantom) form.updatePhantomField(fieldIndex, newField as IFormPhantomField);
    else form.updateField(fieldIndex, newField as IFormField);

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

  console.log(registry);

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
        {"page" in fieldDetails && <>({fieldDetails.page})</>} {fieldDetails.field || "no-name"}
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
                  options={registry
                    .filter((f) => !!f.is_phantom === !!isPhantom)
                    .map((f) => ({ ...f, name: `${f.name}:${f.preset}` }))}
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
            {!isPhantom && (
              <>
                <Badge>Postion X</Badge>
                <Input
                  value={(fieldDetails as IFormField).x}
                  type="number"
                  className="h-7 py-1 text-xs"
                  defaultValue={(fieldDetails as IFormField).x}
                  onChange={handleChangeFactory("x")}
                />
                <Badge>Position Y</Badge>
                <Input
                  value={(fieldDetails as IFormField).y}
                  type="number"
                  className="h-7 py-1 text-xs"
                  defaultValue={(fieldDetails as IFormField).y}
                  onChange={handleChangeFactory("y")}
                />
                <Badge>Width</Badge>
                <Input
                  value={(fieldDetails as IFormField).w}
                  type="number"
                  className="h-7 py-1 text-xs"
                  defaultValue={(fieldDetails as IFormField).w}
                  onChange={handleChangeFactory("w")}
                />
                <Badge>Height</Badge>
                <Input
                  value={(fieldDetails as IFormField).h}
                  type="number"
                  className="h-7 py-1 text-xs"
                  defaultValue={(fieldDetails as IFormField).h}
                  onChange={handleChangeFactory("h")}
                />
                <Badge>Page</Badge>
                <Input
                  value={(fieldDetails as IFormField).page}
                  type="number"
                  className="h-7 py-1 text-xs"
                  defaultValue={(fieldDetails as IFormField).page}
                  onChange={handleChangeFactory("page")}
                />
                <Badge>Horizontal Alignment</Badge>
                <Autocomplete
                  value={(fieldDetails as IFormField).align_h ?? "center"}
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
                  value={(fieldDetails as IFormField).align_v ?? "bottom"}
                  inputClassName="h-7 py-1 text-xs"
                  placeholder="Vertical alignment"
                  options={[
                    { id: "top", name: "top" },
                    { id: "middle", name: "middle" },
                    { id: "bottom", name: "bottom" },
                  ]}
                  setter={(id) => id && void handleChangeFactory("align_v")(id)}
                />
              </>
            )}
            {!isUsingTemplate && (
              <>
                <Badge>Type</Badge>
                <Autocomplete
                  value={fieldDetails.type}
                  inputClassName="h-7 py-1 text-xs"
                  placeholder="Select Field Type"
                  options={FIELD_TYPES.map((s) => ({ id: s, name: s }))}
                  setter={(id) => id && handleChangeFactory("type")(id)}
                />
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
                  options={newParties.map((s) => ({ id: s, name: s }))}
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
  // Use form context's selected preview id so clicking previews selects fields
  const selectedFieldKey = form.selectedPreviewId;
  const setSelectedFieldKey = (id: string | null) => form.setSelectedPreviewId(id);

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

  // Handle when a field is added by user
  const handlePhantomFieldAdd = () => {
    form.addPhantomField({
      field: "",
      type: "email",
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
    for (const field of [...form.fields, ...form.phantomFields]) {
      if (!field.field.trim()) return alert(`${field.field} has an empty field identifier.`);
      if (!field.source) return alert(`${field.field} is missing its source.`);
      if (!field.party) return alert(`${field.field} is missing its party.`);
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
  }, [form.selectedPreviewId, form.keyedFields, registry]);

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

  // Param entries
  const paramEntries = Object.entries(form.params);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex h-20 flex-col justify-center gap-2">
        <div className="flex flex-row items-center gap-2">
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
      <VerticalTabs className="h-full max-h-full w-full gap-0" defaultValue="fields">
        <VerticalTabsList className="rounded-r-none border-r-0">
          <VerticalTabsTrigger className="rounded-[0.33em] hover:cursor-pointer" value="fields">
            Fields
          </VerticalTabsTrigger>
          <VerticalTabsTrigger
            className="rounded-[0.33em] hover:cursor-pointer"
            value="other-inputs"
          >
            Non-Rendered Fields
          </VerticalTabsTrigger>
          <VerticalTabsTrigger className="rounded-[0.33em] hover:cursor-pointer" value="params">
            Form Parameters
            {Object.values(form.params).some((v) => !v) && (
              <pre className="bg-warning text-warning-foreground text-bold absolute right-2 flex h-4 w-4 justify-center rounded-[100%] text-xs">
                !
              </pre>
            )}
          </VerticalTabsTrigger>
          <VerticalTabsTrigger
            className="rounded-[0.33em] hover:cursor-pointer"
            value="subscribers"
          >
            Subscribers
          </VerticalTabsTrigger>
          <VerticalTabsTrigger
            className="rounded-[0.33em] hover:cursor-pointer"
            value="signatories"
          >
            Signatories
          </VerticalTabsTrigger>
        </VerticalTabsList>
        <div className="relative h-full w-[600px] max-w-full border border-l-0 border-gray-300 p-8">
          <TabsContent value="fields">
            <div className="p-4">
              <pre className="my-2">Highlight part of the PDF and add a new field.</pre>
              <div className="mb-2 flex flex-row gap-2">
                {form.document.file && (
                  <Button variant="outline" onClick={handleFieldAdd}>
                    <PlusCircle />
                    Add Field
                  </Button>
                )}
              </div>
            </div>
            <div className="flex max-h-[700px] flex-col overflow-auto">
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
          <TabsContent value="other-inputs">
            <div className="p-4">
              <pre className="my-2">Inputs here don't get rendered on the form itself.</pre>
              <div className="mb-2 flex flex-row gap-2">
                {form.document.file && (
                  <Button variant="outline" onClick={handlePhantomFieldAdd}>
                    <PlusCircle />
                    Add Non-Rendered Field
                  </Button>
                )}
              </div>
            </div>
            <div className="flex max-h-[450px] flex-col overflow-auto">
              {form.keyedPhantomFields
                .filter((f) => !!f)
                .map((field) => (
                  <FieldEditor
                    key={field._id}
                    fieldKey={field._id}
                    fieldIndex={form.keyedPhantomFields.indexOf(field)}
                    selected={false}
                    setSelected={() => {}}
                    fieldDetails={field}
                    isPhantom={true}
                  />
                ))}
            </div>
          </TabsContent>
          <TabsContent value="params">
            <div className="p-4">
              <pre className="my-2">Form parameters store per-form data.</pre>
            </div>
            <div className="flex max-h-[450px] flex-col overflow-auto">
              {!paramEntries.length && (
                <Badge className="w-fit" type="warning">
                  This form has no parameters.
                </Badge>
              )}
              {!!paramEntries.length &&
                paramEntries.map(([key, value], i) => (
                  <div key={key} className="flex flex-row gap-2">
                    <ParamEditor
                      initialParamDetails={{
                        key,
                        value: typeof value === "string" ? value : JSON.stringify(value),
                      }}
                      updateParam={form.updateParam}
                    ></ParamEditor>
                    <Button
                      className="h-7 w-7"
                      scheme="destructive"
                      variant="outline"
                      onClick={() => form.removeParam?.(key)}
                    >
                      <X></X>
                    </Button>
                  </div>
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
      </VerticalTabs>
      <div className="h-20"></div>
    </div>
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
  const [requiredParties, setRequiredParties] = useState<{ party: string; order: number }[]>(
    form.formMetadata.required_parties ?? []
  );

  const [submitting, setSubmitting] = useState(false);

  // Add a party to the order list
  const handleAddParty = (partyName: string) => {
    if (!partyName || requiredParties.some((p) => p.party === partyName)) return;
    setRequiredParties([
      ...requiredParties,
      { party: partyName, order: Math.max(0, ...requiredParties.map((p) => p.order)) + 1 },
    ]);
  };

  // Remove a party from the order list
  const handleRemoveParty = (partyName: string) => {
    setRequiredParties(requiredParties.filter((p) => p.party !== partyName));
  };

  // Update party order number
  const handleUpdatePartyOrder = (partyName: string, newOrder: number) => {
    setRequiredParties(
      requiredParties.map((p) => (p.party === partyName ? { ...p, order: newOrder } : p))
    );
  };

  // Constructs the latest metadata given the state
  const formMetadataDraft: IFormMetadata & { name: string; base_document: File } = useMemo(() => {
    // Make signatures bigger
    const resizedFields = form.fields.map((field) => {
      const {
        _id,
        is_phantom: _is_phantom,
        ...f
      } = {
        ...field,
        h: field.h ?? (field.type === "text" ? 10 : 25),
        _id: null, // TS is being a bitch, don't remove this line lol some type error is slipping thru
        is_phantom: null, // We hide this from the db
      };

      return f;
    });

    // Remove ids lol
    const fixedPhantomFields = form.phantomFields.map((field) => {
      const {
        _id,
        is_phantom: _is_phantom,
        ...f
      } = {
        ...field,
        _id: null, // TS is being a bitch, don't remove this line lol some type error is slipping thru
        is_phantom: null, // We hide this from the db
      };
      return f;
    });

    return {
      required_parties: requiredParties,
      schema_version: SCHEMA_VERSION,
      name: documentName,
      label: documentLabel,
      base_document: form.document.file!,
      schema: resizedFields,
      schema_phantoms: fixedPhantomFields,
      signatories: signatories,
      subscribers: subscribers,
      params: form.params,
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

    console.log("Submitting form with metadata:", formMetadataDraft);

    // After submitting, redirect to new version
    setSubmitting(true);
    await formsControllerRegisterForm(formMetadataDraft as unknown as RegisterFormSchemaDto);
    router.push(`/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/registry`);
    setSubmitting(false);
    close();
  };

  // Handle exporting current draft metadata
  const handleExportMetadata = () => {
    downloadJSON(`${documentName}.metadata.json`, formMetadataDraft);
  };

  const availableParties = newParties.filter(
    (p) => !requiredParties.some((rpo) => rpo.party === p)
  );

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
      <div className="flex flex-col gap-2">
        <Badge className="w-fit max-w-prose">Required Parties (with order)</Badge>
        <div className="flex flex-row gap-2">
          <Autocomplete
            placeholder="Select a party..."
            options={availableParties.map((p) => ({ id: p, name: p }))}
            setter={(id) => id && handleAddParty(id)}
          />
        </div>
        <div className="flex max-h-[200px] flex-col gap-2 overflow-auto rounded border border-gray-300 p-2">
          {requiredParties.length === 0 ? (
            <Badge type="warning" className="w-fit">
              No parties added yet
            </Badge>
          ) : (
            requiredParties
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <div
                  key={item.party}
                  className="flex flex-row items-center gap-2 rounded bg-gray-100 p-2"
                >
                  <Badge>{item.party}</Badge>
                  <Input
                    type="number"
                    min="1"
                    className="h-7 w-16 py-1 text-xs"
                    value={item.order}
                    onChange={(e) =>
                      handleUpdatePartyOrder(item.party, parseInt(e.target.value) || 1)
                    }
                  />
                  <span className="text-xs text-gray-500">(same number = concurrent)</span>
                  <div className="flex-1" />
                  <Button
                    className="h-6 w-6"
                    scheme="destructive"
                    variant="outline"
                    onClick={() => handleRemoveParty(item.party)}
                  >
                    <X />
                  </Button>
                </div>
              ))
          )}
        </div>
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
