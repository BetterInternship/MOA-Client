"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CompanyList from "@/components/univ/dashboard/CompanyList";
import CompanyDetails from "@/components/univ/dashboard/CompanyDetails";
import { Building2, Plus } from "lucide-react";
import { Entity } from "@/types/db";
import { Button } from "@/components/ui/button";
import { useSchoolPartners, useSchoolPartner } from "@/app/api/school.api";

export default function CompaniesPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  // fetch list (stable)
  const { partners, isLoading } = useSchoolPartners({ limit: 200 });
  const entities = (partners as Entity[]) ?? [];

  // client-side filter (no setState)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter((e: any) =>
      [e.name, e.legal_identifier].some((v) => v?.toString().toLowerCase().includes(q))
    );
  }, [entities, query]);

  // auto-select first visible row once it exists
  useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  // fetch fresh details for the selected row
  const {
    entity: selectedEntity,
    history: selectedHistory,
    isLoadingHistory: isLoadingHistory,
  } = useSchoolPartner(selectedId);

  return (
    <div className="min-h-[88vh]">
      {/* header */}
      <div className="mb-6 flex items-center justify-between gap-3 space-y-1">
        <div className="flex items-center gap-3 space-y-1">
          <div className="inline-flex items-center gap-3 rounded-md bg-blue-100 px-3 py-1 text-2xl font-semibold text-blue-800">
            <Building2 />
            Browse Partner Entities
          </div>
          <p className="text-muted-foreground text-sm">
            Browse partner entities and view MOA details.
          </p>
        </div>

        <Link href="/companies/add">
          <Button>
            <Plus />
            Add new entity
          </Button>
        </Link>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="moa:asideWidth:anon"
        className="max-h-[80vh] min-h-[80vh] rounded-md border lg:overflow-hidden"
      >
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <CompanyList
            companies={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            query={query}
            onQueryChange={setQuery}
            isLoading={isLoading}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={74} minSize={40}>
          {isLoading ? (
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="bg-muted h-6 w-1/3 animate-pulse rounded" />
                <div className="bg-muted h-5 w-24 animate-pulse rounded" />
              </div>
              <div className="bg-muted h-24 w-full animate-pulse rounded" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-muted h-16 w-full animate-pulse rounded" />
                <div className="bg-muted h-16 w-full animate-pulse rounded" />
              </div>
            </div>
          ) : selectedEntity ? (
            <CompanyDetails entity={selectedEntity} moaHistory={selectedHistory} />
          ) : null}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
