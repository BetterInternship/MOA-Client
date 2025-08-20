"use client";

import type { MoaRequest } from "@/types/moa-request";
import { Button } from "@/components/ui/button";
import FilesDialog from "@/components/univ/dashboard/FilesDialog";

/** -------- Inline dummy request (used when no req is passed) -------- */
const DUMMY_REQ: MoaRequest = {
  id: "demo-req-1",
  companyName: "Demo Company Inc.",
  contactPerson: "Jane Manager",
  email: "jane@demo.co",
  tin: "000-000-000",
  industry: "Demo",
  requestedAt: "08/10/2025",
  status: "Under Review",
  notes: "",
  history: [
    {
      date: "08/10/2025",
      text: "Submitted MOA request",
      files: [{ id: "f-001", name: "moa-request.pdf", url: "/docs/demo/moa-request.pdf" }],
    },
    { date: "08/11/2025", text: "University requested clarification — missing notarized page" },
    {
      date: "08/12/2025",
      text: "Company uploaded additional documents",
      files: [
        { id: "f-002", name: "notarized-page.pdf", url: "/docs/demo/notarized-page.pdf" },
        { id: "f-003", name: "bir-registration.pdf", url: "/docs/demo/bir-registration.pdf" },
      ],
    },
    { date: "08/12/2025", text: "University noted: documents received, under review" },
    { date: "08/13/2025", text: "MOA approved" },
  ],
};

export default function CompanyRequestHistory({
  req,
  showTitle = true,
}: {
  req?: MoaRequest;
  showTitle?: boolean;
}) {
  // Pick real history if provided, else dummy
  const items = req?.history?.length ? req.history : DUMMY_REQ.history;

  return (
    <div className="rounded-[0.33em] border bg-white p-4">
      {showTitle && (
        <div className="pb-2">
          <h2 className="text-lg font-semibold">Company History</h2>
        </div>
      )}

      <ul className="divide-y">
        {items.map((h, i) => (
          <div key={`${h.date}-${i}`} className="relative py-2 pl-1">
            <div className="grid grid-cols-[96px_1fr_auto] items-center gap-3">
              <div className="text-muted-foreground text-[11px] leading-none">{h.date}</div>
              <p className="min-w-0 truncate text-sm leading-tight">{h.text}</p>
              {h.files?.length ? (
                <FilesDialog
                  files={h.files}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs whitespace-nowrap"
                      title={`View files (${h.files.length})`}
                    >
                      View files ({h.files.length})
                    </Button>
                  }
                />
              ) : (
                <span className="text-muted-foreground text-[11px]">—</span>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <li className="text-muted-foreground py-2 text-sm">No history yet.</li>
        )}
      </ul>
    </div>
  );
}
