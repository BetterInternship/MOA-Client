// components/univ/moa-requests/CompanyList.tsx
"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useEntities } from "@/app/api/school.api";
import type { MoaRequest, Entity } from "@/types/db";
import { formatWhen } from "@/lib/format";
import { Loader } from "@/components/ui/loader";

type Props = {
  requests: MoaRequest[]; // can be our friendly or snake_case variant
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

function getCompanyName(r: MoaRequest, entities: Entity[]): string {
  const eid = r.entity_id;
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

export default function MoaRequestList({ requests, selectedId, onSelect }: Props) {
  const entities = useEntities({ limit: 1000 });
  const outstandingRequests = useMemo(() => {
    return (requests ?? []).filter(isOutstanding);
  }, [requests]);

  return (
    <aside className="h-full">
      <div className="space-y-3 p-3">
        {/* Single impact stat (style preserved) */}
        <div className="flex items-end gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3">
          <div className="-mt-1 text-4xl leading-none font-bold text-rose-900">
            {outstandingRequests.length}
          </div>
          <div className="text-xs font-semibold tracking-wider text-rose-700/90 uppercase">
            outstanding MOA requests
          </div>
        </div>

        {/* List (style preserved) */}
        <div className="max-h-[71vh] overflow-y-auto rounded-md border">
          <ul className="divide-y">
            {entities.isLoading ? (
              <Loader />
            ) : (
              outstandingRequests.map((r: any) => {
                const id = getId(r);
                const active = id === selectedId;
                const companyName = getCompanyName(r, entities.entities);
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
              })
            )}

            {outstandingRequests.length === 0 && (
              <li className="text-muted-foreground px-3 py-2 text-sm">No matches found.</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
