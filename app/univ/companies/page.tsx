// app/univ/companies/page.tsx (your file)
"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CompanyList from "@/components/univ/dashboard/CompanyList";
import CompanyDetails from "@/components/univ/dashboard/CompanyDetails";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

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
    <div className="h-vh">
      {/* Page header */}
      <div className="mb-6 space-y-1 flex items-center gap-3">
        <div className="inline-flex items-center gap-3 rounded-md bg-blue-100 px-3 py-1 text-2xl font-semibold text-blue-800">
          <Building2/>
          Browse Companies
        </div>

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
