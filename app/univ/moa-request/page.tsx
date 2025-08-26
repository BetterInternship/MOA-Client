// app/univ/moa-requests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import MoaRequestList from "@/components/univ/moa-requests/CompanyList";
import CompanyHistoryTree from "@/components/univ/moa-requests/CompanyHistoryTree";
import RequestForResponse from "@/components/univ/company-requests/RequestForResponse";
import FinalDecision from "@/components/univ/company-requests/FinalDecision";
import { FileSignature } from "lucide-react";
import { MoaRequest } from "@/types/db";
import { useMoaRequests } from "@/app/api/school.api";

/* -------------------- tiny date helpers -------------------- */
function toMDY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
const today = () => toMDY(new Date());

export default function MoaRequestsPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const moaRequests = useMoaRequests();

  const selected = useMemo(
    () => moaRequests.requests.find((request) => request.id === selectedId),
    [moaRequests.requests, selectedId]
  );

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
          <MoaRequestList
            requests={moaRequests.requests}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: Details */}
        <ResizablePanel defaultSize={74} minSize={40}>
          <div className="h-full space-y-6 overflow-y-auto p-4">
            {selected ? (
              <>
                <CompanyHistoryTree req={selected} />
                <RequestForResponse onSend={() => {}} loading={moaRequests.isLoading} />
                <FinalDecision
                  onApprove={() => {
                    moaRequests.approve({ id: "" });
                  }}
                  onDeny={() => {
                    moaRequests.deny({ id: "" });
                  }}
                  loading={moaRequests.isLoading}
                />
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
