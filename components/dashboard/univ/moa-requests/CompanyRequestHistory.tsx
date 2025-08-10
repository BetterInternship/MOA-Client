"use client";

import { MoaRequest } from "@/types/moa-request";
import { Button } from "@/components/ui/button";
import FilesDialog from "@/components/shared/FilesDialog"; // your existing dialog

export default function CompanyRequestHistory({ req }: { req: MoaRequest }) {
  const items = req.history;

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="pb-2">
        <h2 className="text-base leading-tight font-semibold">Company Request History</h2>
      </div>

      <ul className="divide-y">
        {items.map((h, i) => (
          <div key={`${h.date}-${i}`} className="relative py-2 pl-3">
            {/* single-line row: date | text | button */}
            <div className="grid grid-cols-[96px_1fr_auto] items-center gap-3">
              {/* date (fixed width) */}
              <div className="text-muted-foreground text-[11px] leading-none">{h.date}</div>

              {/* event text (truncated) */}
              <p className="min-w-0 truncate text-sm leading-tight">{h.text}</p>

              {/* button at the end (only if there are files) */}
              {h.files?.length ? (
                <FilesDialog
                  files={h.files}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs whitespace-nowrap"
                      title={`View files (${h.files.length})`}
                    >
                      View files ({h.files.length})
                    </Button>
                  }
                />
              ) : (
                // keep grid alignment consistent when no files
                <span className="text-muted-foreground text-[11px]">—</span>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <li className="text-muted-foreground py-2 text-sm">No history yet.</li>
        )}
      </ul>
    </div>
  );
}
