"use client";

import { cn } from "@/lib/utils";
import type { CompanyRequest } from "@/types/company-request";
import StatusChip from "@/components/univ/dashboard/StatusChip";

type Props = {
  items: CompanyRequest[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
};

/** ── helpers: format "Submitted" nicely (Manila time + relative) ─────────── */
const dateFmt = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Manila",
});
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatSubmitted(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso; // fallback if backend gave a non-ISO string

  const now = new Date();
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000);
  const absSec = Math.abs(diffSec);

  let rel: string | null = null;
  if (absSec < 60) rel = rtf.format(diffSec, "second");
  else if (absSec < 3600) rel = rtf.format(Math.round(diffSec / 60), "minute");
  else if (absSec < 86400) rel = rtf.format(Math.round(diffSec / 3600), "hour");
  else if (absSec < 7 * 86400) rel = rtf.format(Math.round(diffSec / 86400), "day");

  const local = dateFmt.format(d);
  // show both for recent items; otherwise just the full local time
  return rel ? `${local} · ${rel}` : `${local}`;
}

export default function RequestsList({ items, selectedId, onSelect, loading }: Props) {
  const count = items.length;

  return (
    <aside className="h-full">
      <div className="space-y-3 p-3">
        {/* Single impact stat */}
        <div className="flex items-end gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3">
          <div className="-mt-1 text-4xl leading-none font-bold text-rose-900">{count}</div>
          <div className="text-xs font-semibold tracking-wider text-rose-700/90 uppercase">
            outstanding company requests
          </div>
        </div>

        {/* List */}
        <div className="max-h-[75vh] overflow-y-auto rounded-md border">
          {loading && items.length === 0 ? (
            <ul className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="px-3 py-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-black/10" />
                  <div className="mt-1 h-3 w-1/4 animate-pulse rounded bg-black/10" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y">
              {items.map((r) => {
                const active = r.id === selectedId;
                const submittedLabel = formatSubmitted(r.submittedAt);
                const title =
                  r.submittedAt && !isNaN(new Date(r.submittedAt).getTime())
                    ? new Date(r.submittedAt).toISOString()
                    : r.submittedAt || "";

                return (
                  <li key={r.id}>
                    <button
                      onClick={() => onSelect(r.id)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left transition",
                        active ? "bg-accent" : "hover:bg-accent/60"
                      )}
                      aria-selected={active}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.companyName}</div>
                        <div className="text-muted-foreground truncate text-xs" title={title}>
                          Submitted: {submittedLabel}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {/* Uncomment if you want the chip back */}
                        {/* <StatusChip status={r.status} /> */}
                      </div>
                    </button>
                  </li>
                );
              })}
              {items.length === 0 && !loading && (
                <li className="text-muted-foreground px-3 py-2 text-sm">No items.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
