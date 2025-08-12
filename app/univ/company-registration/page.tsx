"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import RequestsList from "@/components/univ/company-requests/RequestsList";
import CompanyDetails from "@/components/univ/company-requests/CompanyDetails";
import RequestMeta from "@/components/univ/company-requests/RequestMeta";
import RequestForResponse from "@/components/univ/company-requests/RequestForResponse";
import FinalDecision from "@/components/univ/company-requests/FinalDecision";
import type { CompanyRequest } from "@/types/company-request";

export default function CompanyVerificationPage() {
  const [items, setItems] = useState<CompanyRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Load list on mount
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const res = await fetch(`/api/univ/requests?limit=100`, { signal: ctrl.signal });
      const data = await res.json();
      const list: CompanyRequest[] = data.items ?? [];
      setItems(list);
      setSelectedId((prev) => prev || list[0]?.id || "");
    })().catch(console.error);
    return () => ctrl.abort();
  }, []);

  const selected = useMemo(() => items.find((x) => x.id === selectedId), [items, selectedId]);

  async function sendRequestForResponse(msg: string) {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/univ/requests/${selectedId}/request-info`, {
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
      const res = await fetch(`/api/univ/requests/${selectedId}/approve`, {
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
      const res = await fetch(`/api/univ/requests/${selectedId}/deny`, {
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
    <div className="h-full">
      {/* Page header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Company Registration Approvals</h1>
        <p className="text-muted-foreground text-sm">
          Review new company registrations, request clarifications, and approve or deny submissions.
        </p>
      </div>

      {/* Resizable layout */}
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={`moa:asideWidth:anon`}
        className="h-[calc(100vh-180px)] rounded-md border lg:overflow-hidden"
      >
        {/* Left */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <RequestsList items={items} selectedId={selectedId} onSelect={setSelectedId} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right */}
        <ResizablePanel defaultSize={74} minSize={40}>
          <div className="h-full space-y-6 overflow-y-auto p-4">
            {selected ? (
              <>
                <RequestMeta req={selected} />
                <CompanyDetails req={selected} />
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
