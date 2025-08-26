// app/(whatever)/company-requests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RequestsList from "@/components/univ/company-requests/RequestsList";
import CompanyDetails from "@/components/univ/company-requests/CompanyDetails";
import DocumentsCard from "@/components/univ/dashboard/DocumentsCard";
import RequestMeta from "@/components/univ/company-requests/RequestMeta";
import RequestForResponse from "@/components/univ/company-requests/RequestForResponse";
import FinalDecision from "@/components/univ/company-requests/FinalDecision";
import { ClipboardCheck } from "lucide-react";

import { useCompanyRequests, useEntityRequestActions } from "@/hooks/useCompanyRequests";
import type { CompanyRequest } from "@/types/company-request";

const norm = (s?: string | null) =>
  String(s ?? "")
    .trim()
    .toLowerCase();

export default function CompanyVerificationPage() {
  const [tab, setTab] = useState<"pending" | "denied">("pending");
  const [selectedId, setSelectedId] = useState<string>("");

  // fetch all requests for current school (cookie-based)
  const reqsQ = useCompanyRequests({ offset: 0, limit: 100 });
  const all = (reqsQ.data ?? []) as CompanyRequest[];

  // split lists
  const pendingItems = useMemo(
    () =>
      all.filter((r) => {
        const s = norm((r as any).status ?? (r as any).outcome); // supports either shape
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

  // keep selection valid for the active tab
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

  async function onApprove(_note: string) {
    if (!selectedId) return;
    await approve({ id: selectedId }); // POST /api/school/entities/requests/:id/approve
    await reqsQ.refetch();
  }

  async function onDeny(_note: string) {
    if (!selectedId) return;
    await deny({ id: selectedId }); // POST /api/school/entities/requests/:id/deny
    await reqsQ.refetch();
  }

  // placeholder until you wire the endpoint
  async function sendRequestForResponse(_msg: string) {
    return;
  }

  // docs (unchanged)
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

  return (
    <div className="min-h-[88vh]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex items-center gap-3 rounded-md bg-purple-100 px-3 py-1 text-2xl font-semibold text-purple-800">
          <ClipboardCheck />
          Entity Approvals
        </div>
        <p className="text-muted-foreground text-sm">
          Review new entity registrations, request clarifications, and approve or deny submissions.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "denied")} className="mb-3">
        <TabsList>
          <TabsTrigger value="pending">
            Pending / Needs Action
            <span className="text-rose-700 px-1.5 rounded bg-rose-100 text-[11px] font-semibold">
              {pendingItems.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
        </TabsList>
      </Tabs>

      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="moa:requests:layout"
        className="max-h-[80vh] min-h-[80vh] rounded-md border lg:overflow-hidden"
      >
        {/* Left list */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <RequestsList items={list} selectedId={selectedId} onSelect={setSelectedId} variant={tab} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right details */}
        <ResizablePanel defaultSize={74} minSize={40}>
          <div className="h-full space-y-6 overflow-y-auto p-4">
            {selected ? (
              <>
                <RequestMeta req={selected} />
                <CompanyDetails req={selected} />
                <DocumentsCard documents={documents} />

                {/* Only allow actions on the "pending" tab */}
                {tab === "pending" && (
                  <>
                    <RequestForResponse onSend={sendRequestForResponse} loading={busy} />
                    <FinalDecision onApprove={onApprove} onDeny={onDeny} loading={busy} />
                  </>
                )}
              </>
            ) : reqsQ.isLoading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : (
              <div className="text-muted-foreground">No items.</div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
