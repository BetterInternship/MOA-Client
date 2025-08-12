"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

// import MoaMeta from "@/components/univ/moa-requests/MoaMeta";
import CompanyList from "@/components/univ/moa-requests/CompanyList";
// import CompanyDetails from "@/components/univ/moa-requests/CompanyDetails";
import CompanyHistoryTree from "@/components/univ/moa-requests/CompanyHistoryTree";
import RequestForResponse from "@/components/univ/company-requests/RequestForResponse";
import FinalDecision from "@/components/univ/company-requests/FinalDecision";
import { FileSignature } from "lucide-react";

import type { MoaRequest } from "@/types/moa-request";

export default function MoaRequestsPage() {
  const [items, setItems] = useState<MoaRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Load list on mount (and whenever you want to refetch, add deps)
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const res = await fetch(`/api/univ/moa-requests?limit=100`, { signal: ctrl.signal });
      const data = await res.json();
      setItems(data.items ?? []);
      setSelectedId((prev) => prev || data.items?.[0]?.id || "");
    })().catch(console.error);
    return () => ctrl.abort();
  }, []);

  const selected = useMemo(() => items.find((x) => x.id === selectedId), [items, selectedId]);

  async function sendRequestForResponse(msg: string) {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/univ/moa-requests/${selectedId}/request-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) => prev.map((x) => (x.id === selectedId ? data.item : x)));
      }
    } finally {
      setBusy(false);
    }
  }

  async function approve(note: string) {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/univ/moa-requests/${selectedId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) => prev.map((x) => (x.id === selectedId ? data.item : x)));
      }
    } finally {
      setBusy(false);
    }
  }

  async function deny(note: string) {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/univ/moa-requests/${selectedId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) => prev.map((x) => (x.id === selectedId ? data.item : x)));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3 space-y-1">
        <div className="inline-flex items-center gap-3 rounded-md bg-green-100 px-3 py-1 text-2xl font-semibold text-green-800">
          <FileSignature />
          <h1 className="text-2xl font-semibold">MOA Approvals</h1>
        </div>

        <p className="text-muted-foreground text-sm">
          Review MOA requests, view history, request clarifications, and finalize decisions.
        </p>
      </div>

      {/* Resizable layout */}
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={`moa:requests:asideWidth`}
        className="max-h-[80vh] rounded-md border lg:overflow-hidden"
      >
        {/* LEFT: Company list */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <CompanyList items={items} selectedId={selectedId} onSelect={setSelectedId} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: Details */}
        <ResizablePanel defaultSize={74} minSize={40}>
          <div className="h-full space-y-6 overflow-y-auto p-4">
            {selected ? (
              <>
                {/* <MoaMeta req={selected} />
                <CompanyDetails req={selected} /> */}
                <CompanyHistoryTree req={selected} />
                <RequestForResponse onSend={sendRequestForResponse} loading={busy} />
                <FinalDecision onApprove={approve} onDeny={deny} loading={busy} />
              </>
            ) : (
              <div className="text-muted-foreground">No request selected.</div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
