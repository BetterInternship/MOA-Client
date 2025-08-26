// app/univ/moa-requests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import CompanyList from "@/components/univ/moa-requests/CompanyList";
import CompanyHistoryTree from "@/components/univ/moa-requests/CompanyHistoryTree";
import RequestForResponse from "@/components/univ/company-requests/RequestForResponse";
import FinalDecision from "@/components/univ/company-requests/FinalDecision";
import { FileSignature } from "lucide-react";
import { MoaRequest } from "@/types/db";

/* -------------------- tiny date helpers -------------------- */
function toMDY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
const today = () => toMDY(new Date());

export default function MoaRequestsPage() {
  const [items, setItems] = useState<MoaRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Auto-select first item on mount or when list changes
  useEffect(() => {
    if (!items.length) {
      setSelectedId("");
    } else if (!selectedId || !items.some((x) => x.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const selected = useMemo(() => items.find((x) => x.id === selectedId), [items, selectedId]);

  /* -------------------- Actions (pure local/optimistic) -------------------- */
  async function sendRequestForResponse(message: string) {
    if (!selectedId) return;
    setBusy(true);
    try {
      setItems((prev) =>
        prev.map((x) =>
          x.id === selectedId
            ? {
                ...x,
                status: "Needs Info",
                history: [
                  ...x.history,
                  {
                    date: today(),
                    text: "University requested clarification" + (message ? ` — ${message}` : ""),
                    sourceType: "univ",
                  },
                ],
              }
            : x
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function approve(_note: string) {
    if (!selectedId) return;
    setBusy(true);
    try {
      setItems((prev) =>
        prev.map((x) =>
          x.id === selectedId
            ? {
                ...x,
                status: "Approved",
                history: [
                  ...x.history,
                  { date: today(), text: "MOA approved", sourceType: "univ" },
                ],
              }
            : x
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function deny(_note: string) {
    if (!selectedId) return;
    setBusy(true);
    try {
      setItems((prev) =>
        prev.map((x) =>
          x.id === selectedId
            ? {
                ...x,
                status: "Rejected",
                history: [
                  ...x.history,
                  { date: today(), text: "MOA rejected", sourceType: "univ" },
                ],
              }
            : x
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[88vh]">
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
        className="max-h-[80vh] min-h-[80vh] rounded-md border lg:overflow-hidden"
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
