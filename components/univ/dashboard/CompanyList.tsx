// components/univ/dashboard/CompanyList.tsx
"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Accept either camelCase Entity or snake_case API rows
type AnyCompany = {
  id: string;
  // camelCase
  displayName?: string;
  legalIdentifier?: string;
  contactName?: string;
  contactEmail?: string;
  type?: string;
  // snake_case (API)
  display_name?: string;
  legal_identifier?: string;
  contact_name?: string | null;
  contact_email?: string | null;
};

type Props = {
  companies: AnyCompany[];
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  loading?: boolean;
  emptyText?: string;
};

const safeLower = (v?: string | null) => (v ? v.toLowerCase() : "");

const getDisplayName = (c: AnyCompany) => c.displayName ?? c.display_name ?? "";
const getLegalId = (c: AnyCompany) => c.legalIdentifier ?? c.legal_identifier ?? "";
const getContactName = (c: AnyCompany) => c.contactName ?? c.contact_name ?? "";
const getContactEmail = (c: AnyCompany) => c.contactEmail ?? c.contact_email ?? "";

export default function CompanyList({
  companies,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  loading,
  emptyText = "No companies found.",
}: Props) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((c) => {
      return (
        safeLower(getDisplayName(c)).includes(q) ||
        safeLower(getLegalId(c)).includes(q) ||
        safeLower(getContactName(c)).includes(q)
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
            {loading && !companies.length ? (
              <li className="text-muted-foreground px-3 py-2 text-sm">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="text-muted-foreground px-3 py-2 text-sm">{emptyText}</li>
            ) : (
              filtered.map((c) => {
                const active = c.id === selectedId;
                const name = getDisplayName(c);
                const subline = [c.type || "", getContactName(c) || getContactEmail(c) || null]
                  .filter(Boolean)
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
                        <div className="truncate font-medium">{name}</div>
                        <div className="text-muted-foreground truncate text-xs">{subline}</div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
