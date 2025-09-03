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
    <aside className="h-full overflow-hidden">
      <div className="bg-primary/10 flex flex-col items-start gap-1 border-b p-3">
        <div className="text-primary text-xs font-semibold uppercase">
          pending entity requests ({items.length})
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto border">
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
          <ul className="divide-y border-b border-gray-200">
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
    </aside>
  );
}
