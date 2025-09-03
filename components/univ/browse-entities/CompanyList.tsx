"use client";

import { useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton"; // shadcn
import { Entity } from "@/types/db";
import { ucfirst, safeLower } from "@/lib/strings";

type Props = {
  companies: Entity[];
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  isLoading?: boolean;
};

export default function CompanyList({
  companies,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  isLoading,
}: Props) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      [c.display_name, c.legal_identifier, c.contact_name]
        .map((v) => safeLower(v))
        .some((v) => v.includes(q))
    );
  }, [companies, query]);

  return (
    <aside className="relative flex h-full flex-col overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="bg-primary/10 flex flex-col items-start gap-1 border-b p-3">
          <div className="text-primary text-xs font-semibold uppercase">
            approved partner entities ({companies.length})
          </div>
        </div>

        <div className="relative">
          <Input
            className="rounded-none pr-8 pl-9"
            placeholder="Search entity..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            disabled={isLoading}
          />
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 z-10 h-4 w-4 -translate-y-1/2"
          />
          {isLoading && (
            <Loader2
              aria-hidden
              className="text-muted-foreground absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 animate-spin"
            />
          )}
        </div>

        <div className="overflow-y-auto border">
          {isLoading ? (
            <ul className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="px-3 py-2">
                  <Skeleton className="h-6 w-2/3" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y">
              {filtered.map((c) => {
                const active = c.id === selectedId;
                const subline = [ucfirst(c.type), c.contact_name || c.contact_email]
                  .filter(Boolean)
                  .join(" • ");
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => onSelect(c.id)}
                      className={`flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm transition ${
                        active ? "bg-accent" : "hover:bg-accent/60"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate tracking-tight">{c.display_name}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="text-muted-foreground border-b px-3 py-2 text-sm">
                  No matches found.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
