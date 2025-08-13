// components/univ/moa-requests/CompanyList.tsx
"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MoaRequest } from "@/types/moa-request";

type Props = {
  items: MoaRequest[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
};

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Manila",
});

export default function CompanyList({ items, selectedId, onSelect, loading }: Props) {
  const [q] = useState(""); // reserved for future search (keeps your layout)
  const count = items.length;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((r) => r.companyName.toLowerCase().includes(s));
  }, [q, items]);

  return (
    <aside className="h-full">
      <div className="space-y-3 p-3">
        {/* Single impact stat */}
        <div className="flex items-end gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3">
          <div className="-mt-1 text-4xl leading-none font-bold text-rose-900">{count}</div>
          <div className="text-xs font-semibold tracking-wider text-rose-700/90 uppercase">
            outstanding MOA requests
          </div>
        </div>

        <div className="max-h-[71vh] overflow-y-auto rounded-md border">
          {loading && filtered.length === 0 ? (
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
              {filtered.map((r) => {
                const active = r.id === selectedId;
                const d = r.requestedAt ? new Date(r.requestedAt) : null;
                const when = d && !isNaN(d.getTime()) ? dateFmt.format(d) : (r.requestedAt ?? "—");

                return (
                  <li key={r.id}>
                    <button
                      onClick={() => onSelect(r.id)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left transition",
                        active ? "bg-accent" : "hover:bg-accent/60"
                      )}
                    >
                      <div>
                        <div className="font-medium">{r.companyName}</div>
                        <div className="text-muted-foreground text-xs">Requested: {when}</div>
                      </div>
                      {/* keep right side empty to preserve your spacing; add chip later if you want */}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && !loading && (
                <li className="text-muted-foreground px-3 py-2 text-sm">No matches found.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
