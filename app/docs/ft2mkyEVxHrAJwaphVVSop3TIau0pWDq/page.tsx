/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
 * @ Modified time: 2025-10-25 06:40:53
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
import { Upload } from "lucide-react";

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

  // Renders a highlight into a component
  const highlightRenderer = (highlight: ViewportHighlight, index: number) => {
    return (
      <Popup popupContent={<></>} onMouseOver={() => {}} onMouseOut={() => {}} key={index}>
        <AreaHighlight highlight={highlight} onChange={() => {}} isScrolledTo={false} />
      </Popup>
    );
  };

  return (
    <div className="relative mx-auto h-[70vh] max-w-5xl">
      <div className="absolute flex h-full w-full flex-row justify-center gap-2">
        <Sidebar fieldTransform={fieldTransform} setDocumentUrl={setDocumentUrl} />
        {documentUrl && (
          <PdfLoader url={documentUrl} beforeLoad={<Loader />}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
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
 * The sidebar shows metadata about the pdf.
 * This is where Sherwin can add new fields and stuff.
 *
 * @component
 */
const Sidebar = ({
  fieldTransform,
  setDocumentUrl,
}: {
  fieldTransform: { x: number; y: number; w: number; h: number; page: number };
  setDocumentUrl: (documentUrl: string) => void;
}) => {
  // Allows us to click the input without showing it
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentName, setDocumentName] = useState<string>("No File Selected");

  // Handle changes in file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    const url = URL.createObjectURL(file);
    setDocumentUrl(url);
    setDocumentName(file.name);
  };

  return (
    <div className="sidebar w-[25vw] p-10">
      <h1 className="my-2 text-lg font-bold">{documentName}</h1>
      <pre className="my-2">
        x: {fieldTransform.x}, y: {fieldTransform.y}, w: {fieldTransform.w}, h: {fieldTransform.h}
      </pre>
      <Button onClick={() => fileInputRef.current?.click()}>
        <Upload />
        Select File
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <hr className="my-2" />
    </div>
  );
};

export default FormUploadPage;
