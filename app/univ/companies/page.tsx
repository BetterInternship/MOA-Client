// app/univ/companies/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CompanyList from "@/components/univ/dashboard/CompanyList";
import CompanyDetails from "@/components/univ/dashboard/CompanyDetails";
import { Building2 } from "lucide-react";
import { useEntities } from "@/app/api/school.api";
import { DemoRT } from "@/lib/demo-realtime";

export default function CompaniesPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  // returns camelCase Entity[]
  const { entities, loading } = useEntities({ q: query });

  const list = useMemo(() => entities ?? [], [entities]);

  useEffect(() => {
    console.log("[CompaniesPage] list size:", list.length, list.slice(0, 3));
  }, [list]);

  // ensure something is selected
  useEffect(() => {
    if (!list.length) {
      setSelectedId("");
      return;
    }
    const stillExists = list.some((c) => c.id === selectedId);
    if (!selectedId || !stillExists) setSelectedId(list[0].id);
  }, [list, selectedId]);

  const onStage = useCallback(() => setQuery((q) => q), []);
  useEffect(() => {
    DemoRT.onStage(onStage);
  }, [onStage]);

  const selected = useMemo(() => list.find((c) => c.id === selectedId), [list, selectedId]);

  return (
    <div className="space-y-4">
      {/* header unchanged */}

      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="moa:asideWidth:univ:companies"
        className="max-h-[80vh] rounded-md border lg:overflow-hidden"
      >
        {/* List */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <CompanyList
            companies={list}
            selectedId={selectedId}
            onSelect={setSelectedId}
            query={query}
            onQueryChange={setQuery}
            loading={loading}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Details */}
        <ResizablePanel defaultSize={74} minSize={40}>
          <div className="h-full">
            {loading && !selected ? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                Loading…
              </div>
            ) : selected ? (
              <CompanyDetails key={selected.id} company={selected as any} />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                Select a company to view details
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

