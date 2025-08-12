// components/univ/company-requests/RequestsList.tsx
"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CompanyRequest } from "@/types/company-request";
// import StatusChip from "@/components/univ/dashboard/StatusChip";

const safeLower = (v?: string | null) => (v ? v.toLowerCase() : "");

type Props = {
  items: CompanyRequest[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function RequestsList({ items, selectedId, onSelect }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (r) =>
        safeLower(r.companyName).includes(s) ||
        safeLower(r.contactPerson).includes(s) ||
        safeLower(r.industry).includes(s)
    );
  }, [q, items]);

  return (
    <aside className="h-full overflow-y-auto">
      <div className="space-y-3 p-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pl-8"
            placeholder="Search company..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="max-h-[68vh] overflow-y-auto rounded-md border">
          <ul className="divide-y">
            {filtered.map((r) => {
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
                    {/* <StatusChip status={r.status as any} /> */}
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
