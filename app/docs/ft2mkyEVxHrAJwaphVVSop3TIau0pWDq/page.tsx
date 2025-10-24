/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-25 04:12:44
 * @ Modified time: 2025-10-25 06:04:13
 * @ Description:
 *
 * This page will let us upload forms and define their schemas on the fly.
 */

"use client";

import { Loader } from "@/components/ui/loader";
import { JSX, useState } from "react";
import {
  AreaHighlight,
  Comment,
  Highlight,
  IHighlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
} from "react-pdf-highlighter";
import "./react-pdf-highlighter.css";

/**
 * Helps us upload forms and find their coords quickly.
 *
 * @returns
 */
const FormUploadPage = () => {
  const [highlight, setHighlight] = useState<IHighlight | null>(null);
  const [fieldTransform, setFieldTransform] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    page: number;
  }>({ x: 0, y: 0, w: 0, h: 0, page: 1 });

  return (
    <div className="relative mx-auto h-[70vh] max-w-5xl">
      <div className="absolute flex h-full w-full flex-row justify-center gap-2">
        <Sidebar fieldTransform={fieldTransform} />
        <PdfLoader url={"http://docs.localhost:3000/lorem-ipsum.pdf"} beforeLoad={<Loader />}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={() => (document.location.hash = "")}
              scrollRef={(scrollTo) => {}}
              onSelectionFinished={(position, content, hideDropdownAndSelection) => {
                setHighlight({
                  id: "highlight",
                  content,
                  position,
                  comment: { text: "", emoji: "" } as unknown as Comment,
                });
                setFieldTransform({
                  x: ~~position.boundingRect.x1,
                  y: ~~position.boundingRect.y1,
                  w: ~~position.boundingRect.x2 - ~~position.boundingRect.x1,
                  h: ~~position.boundingRect.y2 - ~~position.boundingRect.y1,
                  page: position.pageNumber,
                });
                hideDropdownAndSelection();
                return <></>;
              }}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {
                const isTextHighlight = !highlight.content?.image;
                const component = isTextHighlight ? (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                  />
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={(boundingRect) => {}}
                  />
                );

                return (
                  <Popup
                    popupContent={<HighlightPopup {...highlight} />}
                    onMouseOver={(popupContent: JSX.Element) =>
                      setTip(highlight, (highlight) => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                  >
                    {component}
                  </Popup>
                );
              }}
              highlights={highlight ? [highlight] : []}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
};

const Sidebar = ({
  fieldTransform,
}: {
  fieldTransform: { x: number; y: number; w: number; h: number; page: number };
}) => {
  return (
    <div className="sidebar w-[25vw] p-10">
      <div className="relative">
        <pre>
          x: {fieldTransform.x}, y: {fieldTransform.y}, w: {fieldTransform.w}, h: {fieldTransform.h}
          {/* , page: {fieldTransform.page} */}
        </pre>
      </div>
    </div>
  );
};

const HighlightPopup = ({ comment }: { comment: { text: string; emoji: string } }) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

export default FormUploadPage;
