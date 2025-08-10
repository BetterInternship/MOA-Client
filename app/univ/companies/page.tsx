// /app/companies/page.tsx
"use client";

import { useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { companies as seedCompanies } from "../../../data/companies";
import { Company } from "../../../types/company";
import CompanyList from "@/components/dashboard/univ/CompanyList";
import CompanyDetails from "@/components/dashboard/univ/CompanyDetails";
import { storageKey, usePersistentSizes } from "@/lib/usePersistentSizes";

export default function CompaniesPage() {
  // state
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(seedCompanies[0].id);

  // persist resizable sizes per user
  const userId = undefined; // replace with your real user id if available
  const { sizes, onLayout } = usePersistentSizes(storageKey(userId), [26, 74]);

  // selected item
  const selected: Company = seedCompanies.find((c) => c.id === selectedId) ?? seedCompanies[0];

  if (!sizes) {
    return (
      <div className="space-y-2">
        <div className="bg-muted h-6 w-48 rounded" />
        <div className="bg-muted/60 h-[calc(100vh-180px)] rounded border" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <p className="text-muted-foreground text-sm">
          Browse partner companies and view MOA details.
        </p>
      </div>

      {/* Resizable layout */}
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={onLayout}
        className="h-[calc(100vh-180px)] rounded-md border lg:overflow-hidden"
      >
        <ResizablePanel defaultSize={sizes[0]} minSize={18} maxSize={50}>
          <CompanyList
            companies={seedCompanies}
            selectedId={selectedId}
            onSelect={setSelectedId}
            query={query}
            onQueryChange={setQuery}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={sizes[1]} minSize={40}>
          <CompanyDetails company={selected} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
