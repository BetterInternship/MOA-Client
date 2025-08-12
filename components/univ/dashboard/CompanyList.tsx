"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Entity } from "@/types/db";
// import StatusBadge from "./StatusBadge"; // optional

type Props = {
  companies: Entity[];
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
};

const safeLower = (v?: string | null) => (v ? v.toLowerCase() : "");

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

    return companies.filter((c) => {
      return (
        safeLower(c.display_name).includes(q) ||
        safeLower(c.legal_identifier).includes(q) ||
        safeLower(c.contact_name).includes(q)
      );
    });
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
              const subline = [c.type ? c.type : "", c.contact_name || c.contact_email || null]
                .filter((s) => s)
                .join(" • ");

              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${
                      active ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.display_name}</div>
                      <div className="text-muted-foreground truncate text-xs">{subline}</div>
                    </div>
                    {/* <StatusBadge status={(c as any).status ?? (c as any).moaStatus} /> */}
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
