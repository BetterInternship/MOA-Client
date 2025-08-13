// app/univ/moa-requests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CompanyList from "@/components/univ/moa-requests/CompanyList";
import CompanyHistoryTree from "@/components/univ/moa-requests/CompanyHistoryTree";
import RequestForResponse from "@/components/univ/company-requests/RequestForResponse";
import FinalDecision from "@/components/univ/company-requests/FinalDecision";
import { FileSignature } from "lucide-react";
import type { MoaRequest } from "@/types/moa-request";
import { DemoRT } from "@/lib/demo-realtime";

export default function MoaRequestsPage() {
  const [items, setItems] = useState<MoaRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchList(signal?: AbortSignal) {
    const res = await fetch(`/api/univ/moa-requests?limit=100`, { cache: "no-store", signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list: MoaRequest[] = data.items ?? [];
    setItems(list);
    setSelectedId((prev) => prev || list[0]?.id || "");
  }

  // Load list on mount
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchList(ctrl.signal);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e?.message ?? "Failed to load MOA requests.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  // Optional: refetch when a stage event comes from another tab
  useEffect(() => {
    const off = DemoRT.onStage(() => {
      void fetchList();
    });
    return () => off?.();
  }, []);

  const selected = useMemo(() => items?.find((x) => x.id === selectedId), [items, selectedId]);

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
        DemoRT.sendStage(1); // notify same-origin tabs
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
        DemoRT.sendStage(2);
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
        DemoRT.sendStage(0);
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
        className="rounded-md border lg:overflow-hidden"
      >
        {/* LEFT: Company list */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <CompanyList
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: Details */}
        <ResizablePanel defaultSize={74} minSize={40}>
          <div className="h-full space-y-6 overflow-y-auto p-4">
            {error && <div className="text-sm text-rose-600">{error}</div>}

            {loading && !selected ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : selected ? (
              <>
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
