// components/univ/company-requests/RequestsList.tsx
"use client";

import { cn } from "@/lib/utils";
import type { CompanyRequest } from "@/types/company-request";

type Props = {
  items: CompanyRequest[]; // this list should already be "requires completion"
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function RequestsList({ items, selectedId, onSelect }: Props) {
  const count = items.length;

  return (
    <aside className="h-full overflow-y-auto">
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
                    {/* Optional: add a status chip back if you want */}
                  </button>
                </li>
              );
            })}
            {items.length === 0 && (
              <li className="text-muted-foreground px-3 py-2 text-sm">No items.</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
