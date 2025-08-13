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
}: {
  req: MoaRequest;
  title?: string;
}) {
  const items = req?.history?.length ? req.history : DUMMY_HISTORY;

  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>

      <div className="relative isolate">
        {/* CENTER LINE (more visible + properly centered on md+) */}
        <div
          className={cn(
            "pointer-events-none absolute top-0 bottom-0 z-0",
            "left-5 md:left-1/2 md:-translate-x-1/2",
            "w-[2px] bg-neutral-300 dark:bg-neutral-600"
          )}
          aria-hidden
        />

        <ol className="space-y-6">
          {items.map((h, i) => {
            const side = guessSide(h as any, i);
            const isUniv = side === "univ";
            const date = h.date?.trim()?.length ? h.date : dummyDate(i);

            return (
              <li
                key={`${date}-${i}`}
                className="relative grid grid-cols-1 gap-3 md:grid-cols-[1fr_2rem_1fr] md:gap-6"
              >
                {/* LEFT (Company) */}
                <div
                  className={cn(
                    "flex justify-end md:col-start-1",
                    isUniv && "md:pointer-events-none md:opacity-0"
                  )}
                >
                  <TimelineCard
                    side="company"
                    date={date}
                    text={h.text}
                    files={h.files}
                    comment={(h as any).comment ?? (h as any).note}
                    className="pl-10 md:pl-0"
                    dateAlign="right"
                  />
                </div>

                {/* CENTER DOT (desktop) */}
                <div className="relative hidden md:col-start-2 md:block">
                  <span
                    className={cn(
                      "absolute top-3 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-white",
                      isUniv ? "bg-emerald-500" : "bg-slate-500"
                    )}
                    aria-hidden
                  />
                </div>

                {/* RIGHT (University) */}
                <div
                  className={cn("md:col-start-3", !isUniv && "md:pointer-events-none md:opacity-0")}
                >
                  <TimelineCard
                    side="univ"
                    date={date}
                    text={h.text}
                    files={h.files}
                    comment={(h as any).comment ?? (h as any).note}
                    className="pl-10 md:pl-0"
                  />
                </div>

                {/* MOBILE DOT */}
                <span
                  className={cn(
                    "absolute top-3 left-5 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-white md:hidden",
                    isUniv ? "bg-emerald-500" : "bg-slate-500"
                  )}
                  aria-hidden
                />
              </li>
            );
          })}

          {items.length === 0 && <li className="text-muted-foreground text-sm">No history yet.</li>}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------- Card --------------------------------- */

function TimelineCard({
  side,
  date,
  text,
  files,
  comment,
  className,
  dateAlign = "left", // <- default alignment
}: {
  side: Side;
  date: string;
  text: string;
  files?: { id: string; name: string; url: string }[];
  comment?: string;
  className?: string;
  dateAlign?: "left" | "right" | "center";
}) {
  const isUniv = side === "univ";
  const hasDetails = !!comment || !!files?.length;

  const dateAlignClass = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  }[dateAlign];

  return (
    <Collapsible className={cn("w-fit", className)}>
      {/* Date on top */}
      <div className={cn("text-muted-foreground mb-1 text-xs font-medium", dateAlignClass)}>
        {date}
      </div>

      <div
        className={cn(
          "rounded-lg border bg-white/70 shadow-sm transition",
          isUniv ? "border-emerald-200" : "border-slate-200"
        )}
      >
        {/* Summary row */}
        <div className="flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="text-muted-foreground mb-0.5 flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium",
                  isUniv ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                )}
              >
                {isUniv ? "University" : "Company"}
              </span>

              {/* Paperclip + count */}
              {files?.length ? (
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {files.length}
                </span>
              ) : null}
            </div>
            <p className="text-foreground ml-0.5 min-w-0 truncate text-sm font-medium">{text}</p>
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

        {/* Details */}
        {hasDetails && (
          <CollapsibleContent className="border-t p-3 text-sm">
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


