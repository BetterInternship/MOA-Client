/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
 * @ Modified time: 2025-10-26 16:40:38
 * @ Description:
 *
 * This page will let us upload forms and define their schemas on the fly.
 */

"use client";

import { Loader } from "@/components/ui/loader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CheckCircle, PlusCircle, Upload } from "lucide-react";
import { IFormField } from "@betterinternship/core";
import { Input } from "@/components/ui/input";
import { useModal } from "@/app/providers/modal-provider";
import { createPortal } from "react-dom";
import path from "path";
import { cn } from "@/lib/utils";

/**
 * Helps us upload forms and find their coords quickly.
 * Displays the PDF and allows highlighting on pdf.
 *
 * @component
 */
const FormEditorPage = () => {
  // The current highlight and its transform; only need one for coordinates
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
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
  const editField = useCallback(
    (key: number) => (newField: Partial<IFormField>) => {
      fields[key] = { ...fields[key], ...newField };
      setFields(fields.slice());
    },
    [fields]
  );

  // Renders a highlight into a component
  const highlightRenderer = (highlight: ViewportHighlight, index: number) => {
    console.log(highlight.position.boundingRect);
    return (
      <Popup popupContent={<></>} onMouseOver={() => {}} onMouseOut={() => {}} key={index}>
        <AreaHighlight highlight={highlight} onChange={() => {}} isScrolledTo={false} />
      </Popup>
    );
  };

  return (
    <div className="relative mx-auto h-[70vh] max-w-5xl">
      <div className="absolute flex h-full w-full flex-row justify-center gap-2">
        <Sidebar
          fieldTransform={fieldTransform}
          setDocumentUrl={setDocumentUrl}
          documentFields={fields}
          addDocumentField={addField}
          editDocumentField={editField}
        />
        {documentUrl && (
          <PdfLoader url={documentUrl} beforeLoad={<Loader />}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => true}
                onScrollChange={() => (document.location.hash = "")}
                scrollRef={() => {}}
                highlightTransform={highlightRenderer}
                highlights={highlight ? [highlight] : []}
                onSelectionFinished={onHighlightFinished}
              />
            )}
          </PdfLoader>
        )}
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
  fieldTransform,
  setDocumentUrl,
  documentFields,
  addDocumentField,
  editDocumentField,
}: {
  fieldTransform: { x: number; y: number; w: number; h: number; page: number };
  setDocumentUrl: (documentUrl: string) => void;
  documentFields: IFormField[];
  addDocumentField: (field: IFormField) => void;
  editDocumentField: (key: number) => (field: Partial<IFormField>) => void;
}) => {
  // Allows us to click the input without showing it
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openModal, closeModal } = useModal();
  const [documentName, setDocumentName] = useState<string>("No File Selected");
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
  }, [fieldTransform]);

  // Handles when a file is registered to the db
  const handleFileRegister = () => {
    openModal(
      "register-file-modal",
      <RegisterFileModal documentNamePlaceholder={documentName} close={() => closeModal()} />,
      { title: "Register Form into DB?" }
    );
  };

  // Makes sure that the selected field is always shown at the top
  const sortedDocumentFields = useMemo(() => {
    if (selectedFieldKey === null) return documentFields.toReversed();
    console.log("ind", selectedFieldKey);
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

  return (
    <div className="sidebar w-[25vw] p-10">
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
  close,
}: {
  documentNamePlaceholder: string;
  close: () => void;
}) => {
  const [documentName, setDocumentName] = useState(documentNamePlaceholder);
  const handleSubmit = async () => {
    // ! perform call to endpoint here
    await Promise.resolve("");
    close();
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="text"
        value={documentName}
        placeholder="Enter form name..."
        onChange={(e) => setDocumentName(e.target.value)}
      ></Input>
      <div className="flex flex-row justify-between gap-1">
        <div className="flex-1" />
        <Button
          scheme="supportive"
          disabled={!documentName.trim()}
          onClick={() => void handleSubmit()}
        >
          Submit
        </Button>
        <Button scheme="destructive" variant="outline" onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default FormEditorPage;
