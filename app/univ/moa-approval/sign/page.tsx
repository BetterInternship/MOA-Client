"use client";

import { useMoaRequests, useRequestThread } from "@/app/api/entity.api";
import { useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validate } from "uuid";
import { Loader } from "@/components/ui/loader";
import {
  AreaHighlight,
  Comment,
  Content,
  Highlight,
  IHighlight,
  NewHighlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  ScaledPosition,
} from "react-pdf-highlighter";
import "./react-pdf-highlighter.css";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/ui/autocomplete";

const signatoryOptions = [
  { id: "school_signatory_name", name: "Signatory name" },
  { id: "school_signatory_signature", name: "Signatory signature" },
  { id: "school_signatory_title", name: "Signatory title" },
];

const parseIdFromHash = () => document.location.hash.slice("#highlight-".length);

export function MoaSigningPage() {
  const params = useSearchParams();
  const requestId = params.get("request-id");
  const threadId = params.get("thread-id");
  const router = useRouter();
  const requestThread = useRequestThread(threadId);
  const [highlights, setHighlights] = useState<IHighlight[]>([]);

  const resetHighlights = () => {
    setHighlights([]);
  };

  const scrollViewerTo = useRef((highlight: IHighlight) => {});
  const getNextId = () => String(Math.random()).slice(2);
  const getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };
  const addHighlight = (highlight: NewHighlight) => {
    console.log("Saving highlight", highlight);
    setHighlights((prevHighlights) => [{ ...highlight, id: getNextId() }, ...prevHighlights]);
  };

  const updateHighlight = (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>
  ) => {
    console.log("Updating highlight", highlightId, position, content);
    setHighlights((prevHighlights) =>
      prevHighlights.map((h) => {
        const { id, position: originalPosition, content: originalContent, ...rest } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      })
    );
  };

  const scrollToHighlightFromHash = useCallback(() => {
    const highlight = getHighlightById(parseIdFromHash());
    if (highlight) {
      scrollViewerTo.current(highlight);
    }
  }, []);

  if (requestThread.isLoadingLatestDocument) return <Loader />;
  if (!threadId || !validate(threadId) || !requestId || !validate(requestId))
    return router.push("/dashboard");

  return (
    <div className="relative h-[720px] w-1/2 p-5">
      <div className="absolute flex h-full w-full flex-row gap-2">
        <Sidebar requestId={requestId} highlights={highlights} reset={resetHighlights} />
        <PdfLoader url={requestThread.latestDocument?.document_url ?? ""} beforeLoad={<Loader />}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={() => (document.location.hash = "")}
              scrollRef={(scrollTo) => {
                scrollViewerTo.current = scrollTo as (highlight: IHighlight) => void;
                scrollToHighlightFromHash();
              }}
              onSelectionFinished={(
                position,
                content,
                hideDropdownAndSelection,
                transformSelection
              ) => (
                <AreaDropdown
                  options={signatoryOptions}
                  onSelect={(id?: string | null) => {
                    if (!id) return alert("You must specify area content.");
                    addHighlight({
                      content,
                      position,
                      comment: { text: id, emoji: "" } as unknown as Comment,
                    });
                    hideDropdownAndSelection();
                  }}
                />
              )}
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
                    onChange={(boundingRect) => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) }
                      );
                    }}
                  />
                );

                return (
                  <Popup
                    popupContent={<HighlightPopup {...highlight} />}
                    onMouseOver={(popupContent) => setTip(highlight, (highlight) => popupContent)}
                    onMouseOut={hideTip}
                    key={index}
                  >
                    {component}
                  </Popup>
                );
              }}
              highlights={highlights}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
}

function AreaDropdown({
  options,
  onSelect,
}: {
  options: { id: string; name: string }[];
  onSelect: (id?: string | null) => void;
}) {
  return (
    <div className="rounded-[0.33em] border border-gray-200 bg-white p-3">
      <span>What information should go here?</span>
      <div className="border-gray-200">
        <Autocomplete
          placeholder="Type here..."
          options={options}
          setter={(id?: string | null) =>
            options.some((option) => option.id === id) && onSelect(id)
          }
        ></Autocomplete>
      </div>
    </div>
  );
}

function Sidebar({
  requestId,
  highlights,
  reset,
}: {
  requestId: string;
  highlights: Array<IHighlight>;
  reset: () => void;
}) {
  const moaRequests = useMoaRequests();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="sidebar" style={{ width: "25vw" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h1 className="text-2xl font-bold tracking-tight">Select Signing Areas</h1>
        <small>To select an area, hold ⌥ Option key (Alt), then click and drag.</small>
      </div>

      <ul className="sidebar__highlights">
        {highlights.map((highlight: IHighlight, index: number) => (
          <li
            key={index}
            className="sidebar__highlight"
            onClick={() => (document.location.hash = "")}
          >
            <div>
              <strong>{highlight.comment.text}</strong>
              {highlight.content.text ? (
                <blockquote style={{ marginTop: "0.5rem" }}>
                  {`${highlight.content.text.slice(0, 90).trim()}…`}
                </blockquote>
              ) : null}
              {highlight.content.image ? (
                <div className="highlight__image" style={{ marginTop: "0.5rem" }}>
                  <img src={highlight.content.image} alt={"Screenshot"} />
                </div>
              ) : null}
            </div>
            <div className="highlight__location">Page {highlight.position.pageNumber}</div>
          </li>
        ))}
      </ul>
      {highlights.length > 0 ? (
        <div className="flex flex-row gap-2 p-[1rem]">
          <Button scheme="destructive" onClick={reset}>
            Clear Selections
          </Button>
          <Button
            scheme="primary"
            disabled={loading}
            onClick={() => {
              const formSchema: any[] = [];
              highlights.forEach((highlight) => {
                setLoading(true);
                const x = highlight.position.boundingRect.x1;
                const y = highlight.position.boundingRect.y1;
                const w = highlight.position.boundingRect.x2 - x;
                const h = highlight.position.boundingRect.y2 - y;

                formSchema.push({
                  field: highlight.comment.text,
                  value: "test value for " + highlight.comment.text,
                  type: "text", // ! change
                  x: ~~x + 2,
                  y: ~~y + 2,
                  w: ~~w + 4,
                  h: ~~h + 4,
                  page: highlight.position.pageNumber,
                });
              });
              moaRequests
                .signCustom({
                  data: {
                    school_id: "0fde7360-7c13-4d27-82e9-7db8413a08a5",
                    request_id: requestId,
                    additional_form_schema: formSchema,
                  },
                })
                .then(
                  () => (
                    alert("Successfully signed MOA."),
                    router.push("/moa-approval"),
                    setLoading(false)
                  )
                )
                .catch(() => (alert("Something went wrong."), setLoading(false)));
            }}
          >
            {loading ? "Submitting..." : "Sign and Submit"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const HighlightPopup = ({ comment }: { comment: { text: string; emoji: string } }) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

export default MoaSigningPage;
