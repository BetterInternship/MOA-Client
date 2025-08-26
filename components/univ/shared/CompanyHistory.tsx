// components/univ/shared/CompanyHistory.tsx
"use client";

import { Button } from "@/components/ui/button";
import FilesDialog from "@/components/univ/dashboard/FilesDialog";

interface HistoryEntry {
  message: string;
  effective_date: string;
  expiry_date: string;
  comments: string;
  documents: string;
  timestamp: string;
}

export default function CompanyHistory({
  history,
  showTitle = true,
  loading = false,
}: {
  history: HistoryEntry[];
  showTitle?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-[0.33em] border bg-white p-4">
        {showTitle && (
          <div className="pb-2">
            <h2 className="text-lg font-semibold">Entity History</h2>
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
            const key = `${h.effective_date}-${h.message}-${i}`;
            return (
              <li key={key} className="relative py-2 pl-1">
                <div className="grid grid-cols-[96px_1fr_auto] items-center gap-3">
                  <div className="text-muted-foreground text-sm leading-none">
                    {h.effective_date}
                  </div>
                  <p className="min-w-0 truncate text-sm leading-tight">{h?.message}</p>
                  {h.documents ? (
                    <FilesDialog
                      files={[h.documents ?? ""]}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs whitespace-nowrap"
                          title={`View files (${h.documents?.length})`}
                        >
                          View files (1)
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
