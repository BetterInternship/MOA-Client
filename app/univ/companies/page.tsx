// app/univ/companies/page.tsx (your file)
"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CompanyList from "@/components/univ/dashboard/CompanyList";
import CompanyDetails from "@/components/univ/dashboard/CompanyDetails";
import { Building2 } from "lucide-react";
import { useEntities } from "@/app/api/school.api";
import { Entity } from "@/types/db";

export default function CompaniesPage() {
  const [query, setQuery] = useState("");

  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const e = useEntities();

  useEffect(() => {
    setEntities(e.entities as unknown as any[]);
    console.log(e.entities);
  }, [e.entities]);

  const selected = useMemo(() => entities.find((c) => c.id === selectedId), [entities, selectedId]);

  return (
    <div className="">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3 space-y-1">
        <div className="inline-flex items-center gap-3 rounded-md bg-blue-100 px-3 py-1 text-2xl font-semibold text-blue-800">
          <Building2 />
          Browse Companies
        </div>

        <p className="text-muted-foreground text-sm">
          Browse partner companies and view MOA details.
        </p>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={`moa:asideWidth:anon`}
        className="max-h-[80vh] rounded-md border lg:overflow-hidden"
      >
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <CompanyList
            companies={entities}
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
