// components/univ/moa-requests/CompanyList.tsx
"use client";

import { cn } from "@/lib/utils";
import { useEntities } from "@/app/api/school.api";
import type { MoaRequest, Entity } from "@/types/db";
import { formatWhen } from "@/lib/format";
import { Loader } from "@/components/ui/loader";

type Props = {
  pendingRequests: MoaRequest[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function getCompanyName(r: MoaRequest, entities: Entity[]): string {
  const eid = r.entity_id;
  if (eid && Array.isArray(entities)) {
    const hit = entities.find((e) => e.id === eid);
    if (hit?.display_name) return hit.display_name;
  }
  return "—";
}

export default function MoaRequestList({ pendingRequests, selectedId, onSelect }: Props) {
  const entities = useEntities({ limit: 370 }); // ! (TEMP FIX for now) lets fix soon

  return (
    <aside className="h-full overflow-hidden">
      <div className="bg-primary/10 flex flex-col items-start gap-1 border-b p-3">
        <div className="text-primary text-xs font-semibold uppercase">
          pending MOA requests ({pendingRequests.length})
        </div>
      </div>

      {/* List (style preserved) */}
      <div className="max-h-[71vh] overflow-y-auto">
        <ul className="divide-y border-b">
          {entities.isLoading ? (
            <Loader />
          ) : (
            pendingRequests.map((r) => {
              const id = r.id;
              const active = id === selectedId;
              const companyName = getCompanyName(r, entities.entities);
              const requested = formatWhen(r.timestamp);

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
                  </button>
                </li>
              );
            })
          )}

          {pendingRequests.length === 0 && (
            <li className="text-muted-foreground px-3 py-2 text-sm">No matches found.</li>
          )}
        </ul>
      </div>
    </aside>
  );
}
