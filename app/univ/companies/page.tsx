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
  const [stageVer, setStageVer] = useState(0); // bump to force detail remount

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

  // bump version whenever a stage event arrives
  const onStage = useCallback(() => setStageVer((v) => v + 1), []);
  useEffect(() => {
    const off = DemoRT.onStage(onStage);
    return () => off?.();
  }, [onStage]);

  const selected = useMemo(() => list.find((c) => c.id === selectedId), [list, selectedId]);

  return (
    <div className="space-y-4">
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
              // 👇 force remount on stage changes so useCompanyDetail() refetches
              <CompanyDetails key={`${selected.id}:${stageVer}`} company={selected as any} />
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
