// app/api/univ/companies/[id]/blacklist/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { schoolEntities, listEntityLogs, appendEntityLog, schools } from "@/lib/mock/db";

function getDlsuId() {
  const dlsu = schools.find(
    (s) =>
      s.fullName?.toLowerCase().includes("de la salle") ||
      s.shortName === "DLSU" ||
      s.domain === "dlsu.edu.ph"
  );
  return dlsu?.uid;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const entityId = params.id;
  const dlsuId = getDlsuId();

  // flip status to blacklisted for DLSU link (if exists)
  const link = schoolEntities.find(
    (se) => se.entityId === entityId && (!dlsuId || se.schoolID === dlsuId)
  );
  if (link) link.status = "blacklisted";

  // append a log entry
  appendEntityLog({
    update: "blacklisted",
    source: "school",
    target: "DLSU",
    file: null,
    entityId,
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
