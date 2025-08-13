// app/api/moa/requests/route.ts
import { NextResponse } from "next/server";
import type { MoaItem } from "@/types/moa";
import type { MoaRequest } from "@/types/moa-request";
import { DemoStore } from "@/lib/demo-store";

export async function GET() {
  const { stage, signatory } = DemoStore.get(); // 0 none, 1 under review, 2 approved

  // When there is no request yet, return empty items and empty history
  if (stage === 0) {
    const items: MoaItem[] = [];
    const req: MoaRequest = {
      id: "moa_2025_main",
      history: [], // empty so CompanyRequestHistory shows "No history yet."
    } as any;
    return NextResponse.json({ items, req });
  }

  const status: MoaItem["status"] = stage === 2 ? "Active" : "Under Review";
  const submittedAt = stage === 2 ? "Aug 13, 2025" : "Aug 12, 2025";

  const items: MoaItem[] = [
    {
      id: "moa_2025_main",
      request: "MOA with DLSU (AY 2025–2026)",
      type: "Standard MOA",
      submittedAt,
      status,
    },
  ];

  const req: MoaRequest = {
    id: "moa_2025_main",
    history: [
      {
        date: "08/12/2025",
        text: "Submitted MOA request (Standard)",
        sourceType: "company",
        comment: `Signatory: ${signatory.name || "—"} (${signatory.title || "—"})`,
        files: [{ id: "f-0001", name: "MOA_draft.pdf", url: "/docs/demo/MOA_draft.pdf" }],
      },
      {
        date: "08/12/2025",
        text: "University received request — Under review",
        sourceType: "univ",
        comment: "Auto-routing to DLSU Admins.",
      },
      ...(stage === 2
        ? [
            {
              date: "08/13/2025",
              text: "MOA approved",
              sourceType: "univ",
              files: [{ id: "f-0002", name: "MOA_signed.pdf", url: "/docs/demo/MOA_signed.pdf" }],
            },
          ]
        : []),
    ],
  };

  return NextResponse.json({ items, req });
}
