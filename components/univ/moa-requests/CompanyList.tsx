// components/univ/moa-requests/CompanyList.tsx
"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useEntities } from "@/app/api/school.api";
import type { MoaRequest, Entity } from "@/types/db";
import { formatWhen } from "@/lib/format";

type Props = {
  items: MoaRequest[]; // can be our friendly or snake_case variant
  selectedId: string;
  onSelect: (id: string) => void;
};

/** ---------- tiny helpers to support both shapes ---------- */
function getId(r: any): string {
  return r?.id ?? r?.messageID ?? r?.messageId ?? "";
}
function getStatus(r: any): string {
  // preferred: status; fallback: outcome
  return (r?.status ?? r?.outcome ?? "Under Review") as string;
}
function isOutstanding(r: any): boolean {
  const s = getStatus(r).toLowerCase();
  return !(s === "approved" || s === "rejected");
}
function getCompanyName(r: any, entities?: Entity[]): string {
  // preferred: explicit name from friendly demo data
  if (r?.companyName) return r.companyName as string;

  // fallback: resolve from entities via (entityId | entity_id)
  const eid = r?.entityId ?? r?.entity_id;
  if (eid && Array.isArray(entities)) {
    const hit = entities.find((e) => e.id === eid);
    if (hit?.display_name) return hit.display_name;
  }
  return "—";
}
function getRequestedDate(r: any): string {
  // friendly demo uses requestedAt (MM/DD/YYYY)
  if (r?.requestedAt) return r.requestedAt as string;

  // fallback: ISO timestamp -> formatWhen
  if (r?.timestamp) return formatWhen(r.timestamp as string);

  return "—";
}

export default function CompanyList({ items, selectedId, onSelect }: Props) {
  const [q] = useState(""); // keep your no-UI query for now (style preserved)
  const entities = useEntities(); // used only as a best-effort name resolver

  /** filter: keep only outstanding (not Approved/Rejected); apply query if you add it later */
  const filtered = useMemo(() => {
    const base = (items ?? []).filter(isOutstanding);
    const s = q.trim().toLowerCase();
    if (!s) return base;

    return base.filter((r) => {
      const name = getCompanyName(r, entities.entities as unknown as Entity[]).toLowerCase();
      const status = getStatus(r).toLowerCase();
      const date = getRequestedDate(r).toLowerCase();
      return name.includes(s) || status.includes(s) || date.includes(s);
    });
  }, [items, q, entities.entities]);

  const outstandingCount = filtered.length;

  return (
    <aside className="h-full">
      <div className="space-y-3 p-3">
        {/* Single impact stat (style preserved) */}
        <div className="flex items-end gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3">
          <div className="-mt-1 text-4xl leading-none font-bold text-rose-900">
            {outstandingCount}
          </div>
          <div className="text-xs font-semibold tracking-wider text-rose-700/90 uppercase">
            outstanding MOA requests
          </div>
        </div>

        {/* List (style preserved) */}
        <div className="max-h-[71vh] overflow-y-auto rounded-md border">
          <ul className="divide-y">
            {filtered.map((r: any) => {
              const id = getId(r);
              const active = id === selectedId;
              const companyName = getCompanyName(r, entities.entities as unknown as Entity[]);
              const requested = getRequestedDate(r);

              return (
                <li key={id || Math.random()}>
                  <button
                    onClick={() => id && onSelect(id)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left transition",
                      active ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <div>
                      <div className="font-medium">{companyName}</div>
                      <div className="text-muted-foreground text-xs">Requested: {requested}</div>
                    </div>
                    {/* keep spot for a status chip if you add one later */}
                  </button>
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="text-muted-foreground px-3 py-2 text-sm">No matches found.</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
