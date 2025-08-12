// components/univ/shared/CompanyRequestHistory.tsx
"use client";

import { MoaRequest } from "@/types/moa-request";
import FilesDialog from "@/components/univ/dashboard/FilesDialog";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "univ" | "company";

// Prefer explicit source fields; else alternate by index to demo both sides
function guessSide(h: any, i: number): Side {
  const src = (h?.sourceType ?? h?.source ?? h?.from)?.toString().toLowerCase();
  if (src === "school" || src === "univ" || src === "university") return "univ";
  if (src === "entity" || src === "company") return "company";
  return i % 2 === 0 ? "company" : "univ"; // fallback: alternate
}

// Format MM/DD/YYYY
function toMDY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// Dummy date fallback: today - i days
function dummyDate(i: number) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return toMDY(d);
}

export default function CompanyRequestHistory({ req }: { req: MoaRequest }) {
  const items = req.history;

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Company Request History</h2>

      <div className="flex flex-col gap-3">
        {items.map((h, i) => {
          const side = guessSide(h as any, i);
          const isUniv = side === "univ";
          const displayDate = h.date?.trim()?.length ? h.date : dummyDate(i);

          return (
            <div
              key={`${displayDate}-${i}`}
              className={cn("flex", isUniv ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl border px-3 py-2 text-sm shadow-sm",
                  isUniv
                    ? "rounded-tr-none border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "rounded-tl-none border-slate-200 bg-slate-100 text-slate-900"
                )}
              >
                <p className="break-words whitespace-pre-wrap">{h.text}</p>

                {h.files?.length ? (
                  <div
                    className={cn(
                      "mt-2 flex items-center gap-2",
                      isUniv ? "justify-end" : "justify-start"
                    )}
                  >
                    <FilesDialog
                      files={h.files}
                      trigger={
                        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                          <Paperclip className="h-3.5 w-3.5" />
                          {h.files.length} file{h.files.length > 1 ? "s" : ""}
                        </Button>
                      }
                    />
                  </div>
                ) : null}

                <div
                  className={cn(
                    "text-muted-foreground mt-1 text-[10px]",
                    isUniv ? "text-right" : "text-left"
                  )}
                >
                  {displayDate}
                  <span className="mx-1">•</span>
                  {isUniv ? "University" : "Company"}
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && <div className="text-muted-foreground text-sm">No history yet.</div>}
      </div>
    </div>
  );
}
