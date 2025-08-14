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

/* -------------------- tiny date helpers -------------------- */
function toMDY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
const today = () => toMDY(new Date());

/* -------------------- HARD-CODED DEMO REQUESTS -------------------- */
const DUMMY_REQUESTS: MoaRequest[] = [
  {
    id: "req-demo-001",
    companyName: "Datalogic Systems Corporation",
    contactPerson: "Carlo Ramos",
    email: "carlo.ramos@example.com",
    tin: "TIN-564790255",
    industry: "Technology",
    requestedAt: today(),
    status: "Under Review",
    notes: "",
    history: [
      {
        date: today(),
        text: "Submitted Standard MOA request",
        sourceType: "company",
        files: [
          { id: "f-001", name: "standard-moa.pdf", url: "/docs/demo/standard-moa.pdf" },
          { id: "f-002", name: "sec-registration.pdf", url: "/docs/demo/sec-registration.pdf" },
        ],
      },
      { date: today(), text: "Received by University — queued for review", sourceType: "univ" },
    ],
  },
  {
    id: "req-demo-002",
    companyName: "Asia Peopleworks Inc.",
    contactPerson: "Isabel Reyes",
    email: "isabel@aurora.com",
    tin: "TIN-901245677",
    industry: "Analytics",
    requestedAt: today(),
    status: "Under Review",
    notes: "",
    history: [
      {
        date: today(),
        text: "Submitted Standard MOA request",
        sourceType: "company",
        files: [{ id: "f-101", name: "standard-moa.pdf", url: "/docs/demo/standard-moa.pdf" }],
      },
      { date: today(), text: "Received by University — queued for review", sourceType: "univ" },
    ],
  },
  {
    id: "req-demo-003",
    companyName: "Educ8 Corp.",
    contactPerson: "Miguel Lopez",
    email: "miguel.lopez@example.com",
    tin: "TIN-334500771",
    industry: "Consulting",
    requestedAt: today(),
    status: "Needs Info",
    notes: "Missing notarized signature page",
    history: [
      { date: today(), text: "Submitted Standard MOA request", sourceType: "company" },
      {
        date: today(),
        text: "Requested clarification — please include notarized signature page",
        sourceType: "univ",
      },
    ],
  },
];

export default function MoaRequestsPage() {
  const [items, setItems] = useState<MoaRequest[]>(DUMMY_REQUESTS);
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
                    text:
                      "University requested clarification" +
                      (message ? ` — ${message}` : ""),
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
                history: [...x.history, { date: today(), text: "MOA approved", sourceType: "univ" }],
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
                history: [...x.history, { date: today(), text: "MOA rejected", sourceType: "univ" }],
              }
            : x
        )
      );
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
