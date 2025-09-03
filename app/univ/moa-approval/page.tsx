// app/univ/moa-requests/page.tsx
"use client";

import { useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import MoaRequestList from "@/components/univ/moa-approval/CompanyList";
import { FileSignature } from "lucide-react";
import { useMoaRequests } from "@/app/api/school.api";
import CustomCard from "@/components/shared/CustomCard";
import SchoolEntityConversation from "@/components/univ/moa-approval/SchoolEntityConversation";

export default function MoaRequestsPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const moaRequests = useMoaRequests();

  const pendingRequests = useMemo(
    () =>
      moaRequests.requests
        .filter((request) => !!request.thread_id?.trim())
        .filter((request) => request.outcome !== "approved" && request.outcome !== "denied"),
    [moaRequests.requests]
  );
  const selected = useMemo(
    () => pendingRequests.find((request) => request.id === selectedId),
    [pendingRequests, selectedId]
  );

  return (
    <div className="min-h-[88vh]">
      <div className="mb-6 flex items-center gap-3 space-y-1">
        <span className="text-3xl font-bold tracking-tight text-gray-800">MOA Approvals</span>
      </div>

      {/* Resizable layout */}
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={`moa:requests:asideWidth`}
        className="max-h-[80vh] min-h-[80vh] rounded-[0.33em] border border-gray-300 lg:overflow-hidden"
      >
        {/* LEFT: Company list */}
        <ResizablePanel defaultSize={26} minSize={18} maxSize={50}>
          <MoaRequestList
            pendingRequests={pendingRequests}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: Details */}
        <ResizablePanel defaultSize={74} minSize={40}>
          <div className="flex h-[100%] flex-col space-y-6 overflow-y-auto">
            {selected ? (
              <SchoolEntityConversation req={selected} />
            ) : (
              <CustomCard className="m-3 p-3 px-4">
                <div className="text-muted-foreground">No request selected.</div>
              </CustomCard>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
