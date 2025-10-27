/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
 * @ Modified time: 2025-10-27 11:25:03
 * @ Description:
 *
 * This page will let us upload forms and define their schemas on the fly.
 */

"use client";

import { Loader } from "@/components/ui/loader";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CheckCircle, Download, PlusCircle, Upload } from "lucide-react";
import { IFormField, IFormMetadata } from "@betterinternship/core";
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
} from "../../../api/app/api/endpoints/forms/forms";
import { useSearchParams } from "next/navigation";

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
 * An editable field component.
 * This will probably change in the future, since a field will have more than just coords.
 *
 * @component
 */
const FieldEditor = ({
  initialX,
  initialY,
  initialW,
  initialPage,
  fieldName,
  selected,
  updateField,
}: {
  initialX: number;
  initialY: number;
  initialW: number;
  initialPage: number;
  fieldName: string;
  selected: boolean;
  updateField: (field: { field: string; x: number; y: number; w: number; page: number }) => void;
}) => {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [w, setW] = useState(initialW);
  const [page, setPage] = useState(initialPage);
  const [field, setField] = useState(fieldName);

  useEffect(() => {
    updateField({ field, x, y, w, page });
  }, [field, x, y, w, page]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[0.25em] border p-2",
        selected ? "border-supportive bg-supportive/10" : "border-gray-300"
      )}
    >
      <div className="flex flex-row gap-2">
        <Input
          className="py-1"
          placeholder={"enter-field-name"}
          defaultValue={field}
          onChange={(e) => setField(e.target.value)}
        ></Input>
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        x:
        <Input
          type="number"
          className="py-1"
          defaultValue={x}
          onChange={(e) => setX(parseInt(e.target.value))}
        ></Input>{" "}
        y:
        <Input
          type="number"
          className="py-1"
          defaultValue={y}
          onChange={(e) => setY(parseInt(e.target.value))}
        ></Input>{" "}
        w:
        <Input
          type="number"
          className="py-1"
          defaultValue={w}
          onChange={(e) => setW(parseInt(e.target.value))}
        ></Input>
        page:
        <Input
          type="number"
          className="py-1"
          defaultValue={page}
          onChange={(e) => setPage(parseInt(e.target.value))}
        ></Input>
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
        width: `${w}px`,
        height: `${h}px`,
        fontSize: "12px",
        transform: `translate(${x}px, ${y}px)`,
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
  setDocumentUrl,
  addDocumentField,
  editDocumentField,
}: {
  documentUrl: string | null;
  fieldTransform: { x: number; y: number; w: number; h: number; page: number };
  documentFields: IFormField[];
  initialDocumentName: string | null;
  setDocumentUrl: (documentUrl: string) => void;
  addDocumentField: (field: IFormField) => void;
  editDocumentField: (key: number) => (field: Partial<IFormField>) => void;
}) => {
  // Allows us to click the input without showing it
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openModal, closeModal } = useModal();
  const [documentName, setDocumentName] = useState<string>(initialDocumentName ?? "Select file");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [fieldPreviews, setFieldPreviews] = useState<React.ReactNode[]>([]);
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
    addDocumentField({
      ...fieldTransform,
      h: 12,
      field: "enter-field-name",
      type: "text",
      validator: "",
      transformer: "",
      prefiller: "",
    });
  }, [addDocumentField]);

  // Handles when a file is registered to the db
  const handleFileRegister = useCallback(() => {
    if (!documentFile) return;

    openModal(
      "register-file-modal",
      <RegisterFileModal
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
  }, [documentFile, documentUrl, documentFields]);

  // Makes sure that the selected field is always shown at the top
  const sortedDocumentFields = useMemo(() => {
    if (selectedFieldKey === null) return documentFields.toReversed();
    return [
      documentFields[selectedFieldKey],
      ...documentFields.filter((f, i) => i !== selectedFieldKey).toReversed(),
    ];
  }, [selectedFieldKey, documentFields]);

  // Updates the field previews
  // (we have to touch the DOM directly for this to go under the hoods of the lib we're using)
  useEffect(() => {
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
    return () => setFieldPreviews([]);
  }, [selectedFieldKey, documentFields]);

  // Make sure to set the file when it's specified in the parent
  useEffect(() => {
    if (!documentUrl) return;
    void loadPdfAsFile(documentUrl, documentName).then((file) => setDocumentFile(file));
  }, [documentUrl]);

  return (
    <div className="sidebar w-[30vw] p-10">
      <h1 className="my-2 text-lg font-bold">{documentName}</h1>
      <pre className="my-2">
        x: {fieldTransform.x}, y: {fieldTransform.y}, w: {fieldTransform.w}, h: {fieldTransform.h},
        page: {fieldTransform.page}
      </pre>
      <div className="mb-2 flex flex-row gap-2">
        {documentFile && (
          <Button variant="outline" onClick={handleFieldAdd}>
            <PlusCircle />
            Add Field
          </Button>
        )}
        {documentFile && (
          <Button variant="outline" scheme="supportive" onClick={handleFileRegister}>
            <CheckCircle />
            Register File
          </Button>
        )}
        {!documentFile && (
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload />
            Select File
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
            key={documentFields.indexOf(field)}
            initialX={field.x}
            initialY={field.y}
            initialW={field.w}
            initialPage={field.page}
            fieldName={field.field}
            selected={documentFields.indexOf(field) === selectedFieldKey}
            updateField={editDocumentField(documentFields.indexOf(field))}
          />
        ))}
      </div>
      {fieldPreviews}
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
  documentNamePlaceholder,
  documentFields,
  documentFile,
  close,
}: {
  documentNamePlaceholder: string;
  documentFields: IFormField[];
  documentFile: File;
  close: () => void;
}) => {
  const [documentName, setDocumentName] = useState(documentNamePlaceholder);
  const [submitting, setSubmitting] = useState(false);

  // Constructs the latest metadata given the state
  const formMetadataDraft: IFormMetadata & { name: string; base_document: File } = useMemo(
    () => ({
      version: 0,
      name: documentName,
      base_document: documentFile,
      schema: documentFields,
      email: {
        sender: "",
        subject: "",
        content: "",
      },
      subscribers: [],
    }),
    [documentName, documentFile, documentFields]
  );

  useEffect(() => {
    console.log("latest FIELDS", documentFields);
  }, [documentFields]);

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
      <Input
        type="text"
        value={documentName}
        placeholder="Enter form name..."
        onChange={(e) => setDocumentName(e.target.value)}
      />
      <div className="max-h-[600px] overflow-y-auto">
        <JsonView
          indentWidth={22}
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
