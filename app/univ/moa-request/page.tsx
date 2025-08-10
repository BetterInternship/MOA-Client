"use client";

import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import MoaMeta from "@/components/dashboard/univ/moa-requests/MoaMeta";
import CompanyList from "@/components/dashboard/univ/moa-requests/CompanyList";
import CompanyDetails from "@/components/dashboard/univ/moa-requests/CompanyDetails";
import CompanyRequestHistory from "@/components/dashboard/univ/moa-requests/CompanyRequestHistory";

import RequestForResponse from "@/components/dashboard/univ/requests/RequestForResponse";
import FinalDecision from "@/components/dashboard/univ/requests/FinalDecision";
import StatusChip from "@/components/shared/univ/StatusChip";

import { MOA_REQUESTS } from "@/data/moa-requests";
import { MoaRequest } from "@/types/moa-request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MoaRequestsPage() {
  const [items, setItems] = useState<MoaRequest[]>(MOA_REQUESTS);
  const [selectedId, setSelectedId] = useState(items[0].id);
  const selected = items.find((x) => x.id === selectedId)!;
  const [busy, setBusy] = useState(false);

  async function sendRequestForResponse(msg: string) {
    setBusy(true);
    try {
      // TODO: POST /api/univ/moa-requests/{id}/request-info
      console.log("MOA: Request more info", { id: selectedId, msg });
      setItems((prev) =>
        prev.map((x) => (x.id === selectedId ? { ...x, status: "Needs Info" } : x))
      );
    } finally {
      setBusy(false);
    }
  }

  async function approve(note: string) {
    setBusy(true);
    try {
      // TODO: POST /api/univ/moa-requests/{id}/approve
      console.log("MOA: Approve", { id: selectedId, note });
      setItems((prev) => prev.map((x) => (x.id === selectedId ? { ...x, status: "Approved" } : x)));
    } finally {
      setBusy(false);
    }
  }

  async function deny(note: string) {
    setBusy(true);
    try {
      // TODO: POST /api/univ/moa-requests/{id}/deny
      console.log("MOA: Deny", { id: selectedId, note });
      setItems((prev) => prev.map((x) => (x.id === selectedId ? { ...x, status: "Denied" } : x)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">MOA Requests</h1>
        <p className="text-muted-foreground text-sm">
          Review MOA requests, view history, request clarifications, and finalize decisions.
        </p>
      </div>

      {/* Resizable layout */}
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={`moa:requests:asideWidth`}
        className="h-[calc(100vh-180px)] rounded-md border lg:overflow-hidden"
      >
        {/* LEFT: Company list */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <CompanyList items={items} selectedId={selectedId} onSelect={setSelectedId} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: Details */}
        <ResizablePanel defaultSize={74} minSize={40}>
          <div className="h-full space-y-6 overflow-y-auto p-4">
            <MoaMeta req={selected} />
            <CompanyDetails req={selected} />
            <CompanyRequestHistory req={selected} />
            <RequestForResponse onSend={sendRequestForResponse} loading={busy} />
            <FinalDecision onApprove={approve} onDeny={deny} loading={busy} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
