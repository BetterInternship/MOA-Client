"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import StatusChip from "@/components/univ/dashboard/StatusChip";
import { CompanyRequest } from "@/types/company-request";

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
        r.companyName.toLowerCase().includes(s) ||
        r.contactPerson.toLowerCase().includes(s) ||
        r.industry.toLowerCase().includes(s)
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
                        Requested: {r.submittedAt}
                      </div>
                    </div>
                    {/* <StatusChip status={r.status} /> */}
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
