"use client";

import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import RequestsList from "@/components/dashboard/univ/requests/RequestsList";
import CompanyDetails from "@/components/dashboard/univ/requests/CompanyDetails";
import RequestMeta from "@/components/dashboard/univ/requests/RequestMeta";
import RequestForResponse from "@/components/dashboard/univ/requests/RequestForResponse";
import FinalDecision from "@/components/dashboard/univ/requests/FinalDecision";
import { REQUESTS } from "@/data/company-requests";
import { CompanyRequest } from "@/types/company-request";

export default function CompanyVerificationPage() {
  const [items, setItems] = useState<CompanyRequest[]>(REQUESTS);
  const [selectedId, setSelectedId] = useState(items[0].id);
  const selected = items.find((x) => x.id === selectedId)!;
  const [busy, setBusy] = useState(false);

  async function sendRequestForResponse(msg: string) {
    setBusy(true);
    try {
      // TODO: POST /api/univ/requests/{id}/request-info
      console.log("Requesting more info:", { id: selectedId, msg });
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
      // TODO: POST /api/univ/requests/{id}/approve
      console.log("Approve:", { id: selectedId, note });
      setItems((prev) => prev.map((x) => (x.id === selectedId ? { ...x, status: "Approved" } : x)));
    } finally {
      setBusy(false);
    }
  }

  async function deny(note: string) {
    setBusy(true);
    try {
      // TODO: POST /api/univ/requests/{id}/deny
      console.log("Deny:", { id: selectedId, note });
      setItems((prev) => prev.map((x) => (x.id === selectedId ? { ...x, status: "Denied" } : x)));
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
            <RequestMeta req={selected} />
            <CompanyDetails req={selected} />
            <RequestForResponse onSend={sendRequestForResponse} loading={busy} />
            <FinalDecision onApprove={approve} onDeny={deny} loading={busy} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
