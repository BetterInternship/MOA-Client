"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import StatusChip from "@/components/univ/dashboard/StatusChip";
import { MoaRequest } from "@/types/moa-request";

type Props = {
  items: MoaRequest[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function CompanyList({ items, selectedId, onSelect }: Props) {
  const count = items.length;
  const [q] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (r) =>
        r.companyName.toLowerCase().includes(s) ||
        r.contactPerson.toLowerCase().includes(s) ||
        r.industry.toLowerCase().includes(s)
    );
  }, [q, items]);

  return (
    <aside className="h-full overflow-y-auto">
      <div className="space-y-3 p-3">
        {/* Single impact stat */}
        <div className="flex items-end gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3">
          <div className="-mt-1 text-4xl leading-none font-bold text-rose-900">{count}</div>
          <div className="text-xs font-semibold tracking-wider text-rose-700/90 uppercase">
            outstanding MOA requests
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto rounded-md border">
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
                        Requested: {r.requestedAt}
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
