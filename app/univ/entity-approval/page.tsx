"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RequestsList from "@/components/univ/entity-requests/RequestsList";
import EntityInfoCard from "@/components/shared/EntityInfoCard";
import DocumentsCard from "@/components/univ/browse-entities/DocumentsCard";
import RequestMeta from "@/components/univ/entity-requests/RequestMeta";
import FinalDecision from "@/components/univ/entity-requests/FinalDecision";
import { useCompanyRequests } from "@/hooks/useCompanyRequests";
import type { CompanyRequest } from "@/types/company-request";
import { useEntityRequestActions } from "@/app/api/school.api";
import { NewEntityRequet } from "@/types/db";

const norm = (s?: string | null) =>
  String(s ?? "")
    .trim()
    .toLowerCase();

export default function CompanyVerificationPage() {
  const [tab, setTab] = useState<"pending" | "denied">("pending");
  const [selectedId, setSelectedId] = useState<string>("");

  // fetch all requests
  const reqsQ = useCompanyRequests({ offset: 0, limit: 100 });
  const all = (reqsQ.data ?? []) as NewEntityRequet[];

  // split lists (frontend filter)
  const pendingItems = useMemo(
    () =>
      all.filter((r) => {
        const s = norm((r as any).status ?? (r as any).outcome);
        return (
          s === "" ||
          s === "pending" ||
          s === "needs info" ||
          s === "under review" ||
          s === "conversing"
        );
      }),
    [all]
  );
  const deniedItems = useMemo(
    () => all.filter((r) => norm((r as any).status ?? (r as any).outcome) === "denied"),
    [all]
  );

  const list = tab === "pending" ? pendingItems : deniedItems;
  // console.log("list", reqsQ.data);

  // maintain selection scoped to current tab
  useEffect(() => {
    if (!list.length) {
      setSelectedId("");
      return;
    }
    if (!selectedId || !list.some((x) => x.id === selectedId)) {
      setSelectedId(list[0].id);
    }
  }, [tab, list, selectedId]);

  const selected = useMemo(() => list.find((x) => x.id === selectedId), [list, selectedId]);

  // actions
  const { approve, deny, isPending: busy } = useEntityRequestActions();

  async function onApprove(note: string) {
    if (!selectedId) return;
    await approve({ id: selectedId, reason: note });
    await reqsQ.refetch();
  }

  async function onDeny(note: string) {
    if (!selectedId) return;
    await deny({ id: selectedId, reason: note });
    await reqsQ.refetch();
  }

  // documents
  type AnyDoc = { documentType?: string; url?: string; label?: string; href?: string };
  const documents = useMemo(() => {
    const raw: AnyDoc[] =
      ((selected as any)?.documents as AnyDoc[]) ??
      ((selected as any)?.entity?.entityDocuments as AnyDoc[]) ??
      ((selected as any)?.entityDocuments as AnyDoc[]) ??
      [];
    return raw
      .map((d) => ({ label: d.label ?? d.documentType ?? "Document", href: d.href ?? d.url ?? "" }))
      .filter((d) => d.href);
  }, [selected]);

  const isLoading = reqsQ.isLoading;
  // console.log("selected", selected);

  return (
    <div className="min-h-[88vh]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl font-bold tracking-tight text-gray-800">Entity Approvals</span>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "denied")} className="mb-3">
        <TabsList className="overflow-hidden rounded-[0.33em] border border-gray-300 p-0 font-semibold tracking-tight">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:text-primary rounded-none opacity-40 hover:cursor-pointer data-[state=active]:opacity-100"
          >
            Pending / Needs Action
            <span className="bg-primary/10 text-primary rounded-full px-1.5 text-[11px] font-semibold">
              {pendingItems.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="denied"
            className="data-[state=active]:text-primary rounded-none opacity-40 hover:cursor-pointer data-[state=active]:opacity-100"
          >
            Denied
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="moa:requests:layout"
        className="max-h-[77vh] min-h-[77vh] rounded-[0.33em] border border-gray-300 lg:overflow-hidden"
      >
        {/* Left list */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <RequestsList
            items={list}
            selectedId={selectedId}
            onSelect={setSelectedId}
            variant={tab}
            loading={isLoading}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right details */}
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
          ) : selected ? (
            <div className="h-full space-y-6 overflow-y-auto p-4">
              <RequestMeta req={selected} />

              <EntityInfoCard
                id={selected.entities?.id}
                name={selected.entities?.display_name}
                contactPerson={selected.entities?.contact_name}
                phone={selected.entities?.contact_phone}
                address={selected.entities?.address}
                type={selected.entities?.type}
                legalIdentifier={selected.entities?.legal_identifier}
              />

              <DocumentsCard documents={documents} />
              {tab === "pending" && (
                <>
                  {/* <EntityRequestForResponse onSend={sendRequestForResponse} loading={busy} /> */}
                  <FinalDecision onApprove={onApprove} onDeny={onDeny} loading={busy} />
                </>
              )}
            </div>
          ) : null}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
