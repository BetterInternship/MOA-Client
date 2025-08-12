// app/univ/companies/page.tsx (your file)
"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CompanyList from "@/components/univ/dashboard/CompanyList";
import CompanyDetails from "@/components/univ/dashboard/CompanyDetails";

type CompanyRow = {
  id: string;
  name: string;
  legalName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: "registered" | "approved" | "blacklisted" | null;
  lastActivity: string | null;
  noteCount: number;
  documents: { documentType: string; url: string }[];
};

export default function CompaniesPage() {
  const [query, setQuery] = useState("");

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/univ/companies?limit=50&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCompanies(data.items);
      setSelectedId((prev) => prev || data.items[0]?.id || "");
    };
    load();
  }, [query]);


  const selected = useMemo(
    () => companies.find((c) => c.id === selectedId),
    [companies, selectedId]
  );

  return (
    <div className="h-dvh">
      {/* Page header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <p className="text-muted-foreground text-sm">
          Browse partner companies and view MOA details.
        </p>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={`moa:asideWidth:anon`}
        className="h-[calc(100vh-180px)] rounded-md border lg:overflow-hidden"
      >
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <CompanyList
            companies={companies}
            selectedId={selectedId}
            onSelect={setSelectedId}
            query={query}
            onQueryChange={setQuery}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={74} minSize={40}>
          {selected ? <CompanyDetails company={selected} /> : null}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
