"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { CompanyRequest } from "@/types/company-request";

type Props = {
  items: CompanyRequest[];
  selectedId: string;
  onSelect: (id: string) => void;
  variant?: "pending" | "denied";
  loading?: boolean;
};

export default function RequestsList({
  items,
  selectedId,
  onSelect,
  variant = "pending",
  loading,
}: Props) {
  const count = items.length;

  return (
    <aside className="h-full overflow-y-auto">
      <div className="space-y-3 p-3">
        {/* Impact stat (hidden for 'denied') */}
        {variant !== "denied" && (
          <div className="flex items-end gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3">
            <div className="-mt-1 text-4xl leading-none font-bold text-rose-900">
              {loading ? "—" : count}
            </div>
            <div className="text-xs font-semibold tracking-wider text-rose-700/90 uppercase">
              outstanding company requests
            </div>
          </div>
        )}

        {/* List */}
        <div className="max-h-[75vh] overflow-y-auto rounded-md border">
          {loading ? (
            <ul className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="px-3 py-2">
                  <Skeleton className="mb-1 h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y">
              {items.map((r) => {
                const active = r.id === selectedId;
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
                        <div className="text-muted-foreground text-xs">
                          Submitted: {r.submittedAt}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
              {!items.length && (
                <li className="text-muted-foreground px-3 py-2 text-sm">No items.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
