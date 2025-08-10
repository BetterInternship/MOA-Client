"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import { Company } from "@/types/company";
import StatusBadge from "../../shared/StatusBadge";

type Props = {
  companies: Company[];
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
};

export default function CompanyList({
  companies,
  selectedId,
  onSelect,
  query,
  onQueryChange,
}: Props) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
    );
  }, [companies, query]);

  return (
    <aside className="h-full overflow-y-auto">
      <div className="space-y-3 p-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pl-8"
            placeholder="Search company..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>

        <div className="rounded-md border">
          <ul className="divide-y">
            {filtered.map((c) => {
              const active = c.id === selectedId;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${
                      active ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-muted-foreground text-xs">{c.industry}</div>
                    </div>
                    {/* <StatusBadge status={c.moaStatus} /> */}
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
