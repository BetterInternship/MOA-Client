"use client";

import { useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { companies as seedCompanies } from "../../../data/companies";
import { Company } from "../../../types/company";
import CompanyList from "@/components/dashboard/univ/CompanyList";
import CompanyDetails from "@/components/dashboard/univ/CompanyDetails";

export default function CompaniesPage() {
  const safeCompanies = seedCompanies?.length ? seedCompanies : [];
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(
    safeCompanies[0]?.id ?? "" // avoid crash on empty data
  );

  const selected: Company | undefined =
    safeCompanies.find((c) => c.id === selectedId) ?? safeCompanies[0];

  return (
    <div className="h-dvh">
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
        autoSaveId={`moa:asideWidth:anon`}
        className="h-[calc(100vh-180px)] rounded-md border lg:overflow-hidden"
      >
        {/* LEFT */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <CompanyList
            companies={safeCompanies}
            selectedId={selectedId}
            onSelect={setSelectedId}
            query={query}
            onQueryChange={setQuery}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT */}
        <ResizablePanel defaultSize={74} minSize={40}>
          {/* Only render details if we have a selected company */}
          {selected ? <CompanyDetails company={selected} /> : null}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
