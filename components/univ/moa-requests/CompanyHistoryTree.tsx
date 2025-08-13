// components/univ/shared/CompanyRequestHistory.tsx
"use client";

import { MoaRequest } from "@/types/moa-request";
import FilesDialog from "@/components/univ/dashboard/FilesDialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Paperclip, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "univ" | "company";

function guessSide(h: any, i: number): Side {
  const src = (h?.sourceType ?? h?.source ?? h?.from)?.toString().toLowerCase();
  if (src === "school" || src === "univ" || src === "university") return "univ";
  if (src === "entity" || src === "company") return "company";
  return i % 2 === 0 ? "company" : "univ";
}

function toMDY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
function dummyDate(i: number) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return toMDY(d);
}

/** Fallback demo data (only used when req.history is empty) */
const DUMMY_HISTORY: MoaRequest["history"] = [
  {
    date: "08/10/2025",
    text: "Submitted MOA request",
    files: [{ id: "f-001", name: "moa-request.pdf", url: "/docs/demo/moa-request.pdf" }],
    sourceType: "company",
    comment: "Initial submission via portal.",
  },
  {
    date: "08/11/2025",
    text: "University requested clarification — missing notarized page",
    sourceType: "univ",
    comment: "Please include the notarized signature page.",
  },
  {
    date: "08/12/2025",
    text: "Company uploaded additional documents",
    files: [
      { id: "f-002", name: "notarized-page.pdf", url: "/docs/demo/notarized-page.pdf" },
      { id: "f-003", name: "bir-registration.pdf", url: "/docs/demo/bir-registration.pdf" },
    ],
    sourceType: "company",
  },
  {
    date: "08/12/2025",
    text: "University noted: documents received, under review",
    sourceType: "univ",
  },
  { date: "08/13/2025", text: "MOA approved", sourceType: "univ" },
];

export default function CompanyRequestHistory({
  req,
  title = "Company Request Timeline",
  showTitle = true,
}: {
  req?: MoaRequest;
  title?: string;
  showTitle?: boolean;
}) {
  const items = req?.history?.length ? req.history : DUMMY_HISTORY;

  return (
    <section className="rounded-lg border bg-white p-4">
      {showTitle && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}

      {/* Chat column */}
      <ol className="space-y-4">
        {items.map((h, i) => {
          const side = guessSide(h as any, i);
          const isUniv = side === "univ"; // univ = right bubble
          const date = h.date?.trim()?.length ? h.date : dummyDate(i);

          return (
            <li
              key={`${date}-${i}`}
              className={cn("flex", isUniv ? "justify-end" : "justify-start")}
            >
              <ChatBubble
                side={side}
                date={date}
                text={h.text}
                files={h.files}
                comment={(h as any).comment ?? (h as any).note}
                dateAlign={isUniv ? "right" : "left"}
              />
            </li>
          );
        })}

        {items.length === 0 && <li className="text-muted-foreground text-sm">No history yet.</li>}
      </ol>
    </section>
  );
}

/* ============================== Chat Bubble ============================== */

function ChatBubble({
  side,
  date,
  text,
  files,
  comment,
  dateAlign = "left",
}: {
  side: Side;
  date: string;
  text: string;
  files?: { id: string; name: string; url: string }[];
  comment?: string;
  dateAlign?: "left" | "right" | "center";
}) {
  const isUniv = side === "univ";
  const hasDetails = !!comment || !!files?.length;

  const dateAlignClass =
    dateAlign === "center" ? "text-center" : dateAlign === "right" ? "text-right" : "text-left";

  return (
    <Collapsible
      className={cn(
        "max-w-[min(42rem,85%)]",
        isUniv ? "items-end" : "items-start",
        "flex flex-col gap-1"
      )}
    >
      {/* Bubble */}
      <div
        className={cn(
          "rounded-2xl border bg-white/80 shadow-sm transition",
          "focus-within:shadow-md hover:shadow-md",
          // side color accents
          isUniv ? "border-emerald-200" : "border-slate-200",
          // bubble padding
          "px-3 py-2"
        )}
      >
        {/* Header row: role + paperclip + chevron */}
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex justify-between gap-2">
              <div className="text-muted-foreground mb-1 flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-medium",
                    isUniv ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                  )}
                >
                  {isUniv ? "University" : "Company"}
                </span>

                <time>{date}</time>
                {/* Paperclip + count */}
                {files?.length ? (
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    {files.length}
                  </span>
                ) : null}
              </div>

              {hasDetails ? (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-7 w-7 shrink-0"
                    aria-label="Toggle details"
                  >
                    <ChevronDown className="h-4 w-4 transition data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
              ) : null}
            </div>

            {/* Message text */}
            <p className="text-foreground min-w-0 text-sm font-medium break-words">{text}</p>
          </div>
        </div>

        {/* Dropdown content */}
        {hasDetails && (
          <CollapsibleContent className="border-t pt-2 text-sm">
            {comment ? <p className="text-foreground mb-2">{comment}</p> : null}

            {files?.length ? (
              <div className="flex items-center gap-2">
                <Paperclip className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">
                  {files.length} file{files.length > 1 ? "s" : ""}
                </span>
                <FilesDialog
                  files={files}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      title={`View files (${files.length})`}
                    >
                      View files
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="text-muted-foreground">No attachments</div>
            )}
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
