/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
 * @ Modified time: 2025-10-26 14:00:06
 * @ Description:
 *
 * This page will let us upload forms and define their schemas on the fly.
 */

"use client";

import { Loader } from "@/components/ui/loader";
import { useRef, useState } from "react";
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
import path from "path";

/**
 * Helps us upload forms and find their coords quickly.
 * Displays the PDF and allows highlighting on pdf.
 *
 * @component
 */
const FormUploadPage = () => {
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
    return <></>;
  };

  // Adds a new field to be displayed
  const addField = (field: IFormField) => {
    setFields([...fields, field]);
  };

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
  fieldName,
}: {
  initialX: number;
  initialY: number;
  initialW: number;
  fieldName: string;
}) => {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [w, setW] = useState(initialW);
  const [field, setField] = useState(fieldName);

  return (
    <div className="flex flex-col gap-2 rounded-[0.33em] border border-gray-300 p-2">
      <div className="flex flex-row gap-2">
        <Input
          className="py-1"
          placeholder={"enter-field-name"}
          defaultValue={field}
          onChange={(e) => setField(field)}
        ></Input>
      </div>
      <div className="flex flex-row gap-2">
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
      </div>
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
}: {
  fieldTransform: { x: number; y: number; w: number; h: number; page: number };
  setDocumentUrl: (documentUrl: string) => void;
  documentFields: IFormField[];
  addDocumentField: (field: IFormField) => void;
}) => {
  // Allows us to click the input without showing it
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openModal, closeModal } = useModal();
  const [documentName, setDocumentName] = useState<string>("No File Selected");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

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
  const handleFieldAdd = () => {
    addDocumentField({
      ...fieldTransform,
      field: "enter-field-name",
      type: "text",
      validator: "",
      transformer: "",
      prefiller: "",
    });
  };

  // Handles when a file is registered to the db
  const handleFileRegister = () => {
    openModal(
      "register-file-modal",
      <RegisterFileModal documentNamePlaceholder={documentName} close={() => closeModal()} />,
      { title: "Register Form into DB?" }
    );
  };

  return (
    <div className="sidebar w-[25vw] p-10">
      <h1 className="my-2 text-lg font-bold">{documentName}</h1>
      <pre className="my-2">
        x: {fieldTransform.x}, y: {fieldTransform.y}, w: {fieldTransform.w}, h: {fieldTransform.h}
      </pre>
      <div className="flex flex-row gap-2">
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
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload />
          Select File
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
      <hr className="my-2" />
      <div className="flex flex-col">
        {documentFields.map((field) => (
          <FieldEditor
            initialX={field.x}
            initialY={field.y}
            initialW={field.w}
            fieldName={field.field}
          ></FieldEditor>
        ))}
      </div>
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

export default FormUploadPage;
