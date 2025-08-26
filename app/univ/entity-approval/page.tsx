// app/(whatever)/company-requests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import RequestsList from "@/components/univ/company-requests/RequestsList";
import CompanyDetails from "@/components/univ/company-requests/CompanyDetails";
import DocumentsCard from "@/components/univ/dashboard/DocumentsCard";
import RequestMeta from "@/components/univ/company-requests/RequestMeta";
import RequestForResponse from "@/components/univ/company-requests/RequestForResponse";
import FinalDecision from "@/components/univ/company-requests/FinalDecision";
import { ClipboardCheck } from "lucide-react";

import { useCompanyRequests, useEntityRequestActions } from "@/hooks/useCompanyRequests";

export default function CompanyVerificationPage() {
  const [selectedId, setSelectedId] = useState<string>("");

  // list from backend (uses cookie)
  const reqsQ = useCompanyRequests({ offset: 0, limit: 100 });
  const items = reqsQ.data ?? [];

  // auto-select first item once loaded
  useEffect(() => {
    if (!selectedId && items.length) setSelectedId(items[0].id);
  }, [items, selectedId]);

  const selected = useMemo(() => items.find((x) => x.id === selectedId), [items, selectedId]);

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
      <div className="mb-6 flex items-center gap-3 space-y-1">
        <div className="inline-flex items-center gap-3 rounded-md bg-purple-100 px-3 py-1 text-2xl font-semibold text-purple-800">
          <ClipboardCheck />
          Entity Approvals
        </div>
        <p className="text-muted-foreground text-sm">
          Review new entity registrations, request clarifications, and approve or deny submissions.
        </p>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={`moa:asideWidth:anon`}
        className="max-h-[80vh] min-h-[80vh] rounded-md border lg:overflow-hidden"
      >
        {/* Left list */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <RequestsList items={items} selectedId={selectedId} onSelect={setSelectedId} />
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
                <RequestForResponse onSend={sendRequestForResponse} loading={busy} />
                <FinalDecision onApprove={onApprove} onDeny={onDeny} loading={busy} />
              </>
            ) : reqsQ.isLoading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : (
              <div className="text-muted-foreground">No request selected.</div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
