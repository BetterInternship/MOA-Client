// app/api/company/moa/submit-standard/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  findEntityById,
  moaRequests,
  schools,
  schoolAccounts,
  appendEntityLog,
} from "@/lib/mock/db";
import { DemoStore } from "@/lib/demo-store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { entityId, signatory } = body ?? {};

  if (!entityId) return NextResponse.json({ error: "entityId required" }, { status: 400 });

  const entity = findEntityById(entityId);
  if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  const dlsu = schools.find((s) => s.shortName === "DLSU") ?? schools[0];
  const approver =
    schoolAccounts.find((a) => a.schoolId === dlsu.uid && a.role === "company_approver") ??
    schoolAccounts.find((a) => a.schoolId === dlsu.uid) ??
    schoolAccounts[0];

  // 1) upsert a MOA request row for this entity, mark as APPROVED immediately
  const nowIso = new Date().toISOString();
  let row = moaRequests.find((r) => r.entityID === entity.id);

  if (!row) {
    row = {
      messageID: randomUUID(),
      entityID: entity.id,
      schoolID: dlsu.uid,
      notifySchoolAccount: approver?.id,
      processedBy: approver?.id,
      processedDate: nowIso,
      resultAction: "approved",
      timestamp: nowIso,
    };
    moaRequests.unshift(row);
  } else {
    row.processedBy = approver?.id;
    row.processedDate = nowIso;
    row.resultAction = "approved";
    // keep original timestamp (submission time) if you prefer; otherwise update:
    row.timestamp = row.timestamp ?? nowIso;
  }

  // 2) demo store (drives UI badge & corp site)
  if (signatory?.name && signatory?.title) {
    DemoStore.setSignatory(signatory.name, signatory.title);
  }
  DemoStore.setStage(2);

  // 3) logs (dashboard already reads these)
  appendEntityLog({
    update: "requested",
    source: "entity",
    target: dlsu.shortName,
    file: null,
    entityId: entity.id,
  });
  appendEntityLog({
    update: "approved",
    source: "school",
    target: dlsu.shortName,
    file: null,
    entityId: entity.id,
  });

  return NextResponse.json(
    {
      ok: true,
      messageID: row.messageID,
      stage: 2,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
