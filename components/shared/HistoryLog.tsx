"use client";

import { Button } from "@/components/ui/button";
import FilesDialog from "@/components/univ/dashboard/FilesDialog";

interface HistoryEntry {
  text: string;
  effective_date: string;
  expiry_date: string;
  documents: string;
  timestamp: string;
}

export default function HistoryLog({
  history,
  showTitle = true,
  loading = false,
}: {
  history: HistoryEntry[];
  showTitle?: boolean;
  loading?: boolean;
}) {
  console.log(history);
  if (loading) {
    return (
      <div className="rounded-[0.33em] border bg-white p-4">
        {showTitle && (
          <div className="pb-2">
            <h2 className="text-lg font-semibold">MOA History</h2>
          </div>
        )}
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-[96px_1fr_auto] items-center gap-3">
              <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
              <div className="bg-muted h-6 w-20 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[0.33em] border bg-white p-4">
      {showTitle && (
        <div className="pb-2">
          <h2 className="text-lg font-semibold">Entity History</h2>
        </div>
      )}

      {!history?.length ? (
        <div className="text-muted-foreground py-2 text-sm">No history yet.</div>
      ) : (
        <ul className="divide-y">
          {history?.map((h, i) => {
            const key = `${h.effective_date}-${h.text}-${i}`;
            return (
              <li key={key} className="relative py-2 pl-1">
                <div className="grid grid-cols-[96px_1fr_auto] items-center gap-3">
                  <div className="text-muted-foreground text-sm leading-none">
                    {h.effective_date}
                  </div>
                  <p className="min-w-0 truncate text-sm leading-tight">{h?.text}</p>
                  {h.documents ? (
                    <FilesDialog
                      files={[h.documents ?? ""]}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs whitespace-nowrap"
                          title={`View files`}
                        >
                          View files
                        </Button>
                      }
                    />
                  ) : (
                    <span className="text-muted-foreground text-[11px]">—</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
