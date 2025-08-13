// app/api/univ/companies/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import {
  findEntityById,
  listEntityLogs,
  schoolEntities,
  findSchoolById,
  schools,
} from "@/lib/mock/db";
import { DemoStore } from "@/lib/demo-store";

function toMDY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const entity = findEntityById(params.id); // now searches by id
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const links = schoolEntities
    .filter((se) => se.entityId === entity.id)
    .map((se) => ({
      id: se.id,
      schoolId: se.schoolID,
      school: findSchoolById(se.schoolID)?.shortName || "Unknown",
      status: se.status,
    }));

  const logs = listEntityLogs(entity.id)
    .slice(-15)
    .reverse()
    .map((l) => ({
      date: toMDY(new Date(l.timestamp)),
      update: l.update,
      source: l.source,
      target: l.target,
      file: l.file,
    }));

  const { stage, signatory } = DemoStore.get();
  const submittedDate = toMDY(new Date());
  const approvedDate = toMDY(new Date());
  const validUntil = toMDY(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const status = stage === 2 ? "Approved" : stage === 1 ? "Under Review" : "Inactive";

  const moa = {
    status,
    validUntil: stage === 2 ? validUntil : undefined,
    downloadUrl: `/docs/${entity.id}/moa.pdf`, // ← id
  };

  const request = {
    id: "moa_2025_main",
    companyName: entity.displayName,
    contactPerson: entity.contactName,
    email: entity.contactEmail,
    tin: "—",
    industry: "—",
    requestedAt: submittedDate,
    status:
      status === "Approved" ? "Approved" : status === "Under Review" ? "Under Review" : "Pending",
    notes: "",
    history:
      stage === 0
        ? []
        : stage === 1
          ? [
              {
                date: submittedDate,
                text: "Submitted MOA request (Standard)",
                sourceType: "company",
                comment: `Signatory: ${signatory.name || "—"} (${signatory.title || "—"})`,
                files: [{ id: "f-0001", name: "MOA_draft.pdf", url: "/docs/demo/MOA_draft.pdf" }],
              },
              {
                date: submittedDate,
                text: "University received request — Under review",
                sourceType: "univ",
              },
            ]
          : [
              {
                date: approvedDate,
                text: "MOA approved",
                sourceType: "univ",
                files: [{ id: "f-0002", name: "MOA_signed.pdf", url: "/docs/demo/MOA_signed.pdf" }],
              },
              {
                date: submittedDate,
                text: "Submitted MOA request (Standard)",
                sourceType: "company",
                comment: `Signatory: ${signatory.name || "—"} (${signatory.title || "—"})`,
                files: [{ id: "f-0001", name: "MOA_draft.pdf", url: "/docs/demo/MOA_draft.pdf" }],
              },
            ],
  };

  return NextResponse.json(
    {
      entity: {
        id: entity.id, // ← id
        displayName: entity.displayName,
        legalName: entity.legalName,
        contactName: entity.contactName,
        contactEmail: entity.contactEmail,
        contactPhone: entity.contactPhone,
        entityDocuments: entity.entityDocuments,
      },
      links,
      logs,
      moa,
      request,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
