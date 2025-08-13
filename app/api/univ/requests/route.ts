// app/api/univ/requests/route.ts
import { NextResponse } from "next/server";
import { newEntityRequests, findEntityById } from "@/lib/mock/db";
import type { CompanyRequest, RequestStatus } from "@/types/company-request";

// Simple mock industries
const industries = ["Technology", "Logistics", "Media", "Analytics", "Foods", "Partners"];

function toStatus(
  resultAction?: "approved" | "denied" | "continuedDialogue",
  processedBy?: string
): RequestStatus {
  if (!processedBy) return "Pending";
  if (resultAction === "approved") return "Approved";
  if (resultAction === "denied") return "Denied";
  return "Needs Info"; // continuedDialogue
}

function toCompanyRequest(row: (typeof newEntityRequests)[number]): CompanyRequest {
  const e = findEntityById(row.entityID);
  const docs = [
    { documentType: "SEC registration", url: "/docs/mock/moa/moa-1.pdf" },
    { documentType: "BIR registration", url: "/docs/mock/moa/moa-2.pdf" },
  ];

  // We stored optional mock notes on the request object itself (non-typed) during actions
  const notes = (row as any).notes as string | undefined;

  return {
    id: row.messageID,
    entityId: row.entityID,
    companyName: e?.displayName ?? "—",
    contactPerson: e?.contactName ?? null,
    email: e?.contactEmail ?? null,
    tin: e?.legalIdentifier ?? null,
    industry: industries[Math.floor((row.entityID.charCodeAt(0) || 0) % industries.length)] ?? null,
    submittedAt: row.timestamp,
    status: toStatus(row.resultAction, row.processedBy),
    notes,
    // either of these will be picked up by your page
    entityDocuments: docs,
    documents: docs.map((d) => ({ label: d.documentType, href: d.url })),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase();
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  // Build + filter by companyName/email/tin
  const all = newEntityRequests.map(toCompanyRequest).filter((r) => {
    if (!q) return true;
    return (
      r.companyName.toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.tin ?? "").toLowerCase().includes(q)
    );
  });

  const items = all.slice(offset, offset + limit);

  return NextResponse.json(
    { total: all.length, items },
    { headers: { "Cache-Control": "no-store" } }
  );
}
