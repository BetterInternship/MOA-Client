// app/api/univ/companies/route.ts
import { json, badRequest } from "@/lib/api/utils";
import {
  listEntities,
  listEntityLogs,
  listSchoolEntities,
  schools,
  privateNotes,
  moaRequests,
  newEntityRequests,
  entityLogs,
} from "@/lib/mock/db";
import type { EntityLog } from "@/types/db";

type CompanyStatus = "registered" | "approved" | "blacklisted";

// Derive a status when no per-school status is available
function deriveStatusFromLogs(
  entityId: string,
  opts?: { fallback?: CompanyStatus | null }
): CompanyStatus | null {
  const SIGNALS: EntityLog["update"][] = [
    "approved",
    "blacklisted",
    "registered",
    "revoked",
    "requested",
  ];
  const latest = entityLogs
    .filter((l) => l.entityId === entityId && SIGNALS.includes(l.update))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .at(-1);

  if (!latest) return opts?.fallback ?? null;

  switch (latest.update) {
    case "approved":
      return "approved";
    case "blacklisted":
    case "revoked":
      return "blacklisted";
    case "registered":
    case "requested":
      return "registered";
    default:
      return opts?.fallback ?? null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 25);
  const offset = Number(searchParams.get("offset") ?? 0);
  const schoolId = searchParams.get("schoolId") ?? undefined;

  if (Number.isNaN(limit) || Number.isNaN(offset))
    return badRequest("limit/offset must be numbers");
  if (schoolId && !schools.find((s) => s.uid === schoolId)) return badRequest("Invalid schoolId");

  const { items, total } = listEntities({ q, limit, offset });

  const rows = items.map((e) => {
    // Prefer per-school status; fallback to derived-from-logs
    const rel = schoolId
      ? (listSchoolEntities(schoolId).find((se) => se.entityId === e.uid)?.status ??
        deriveStatusFromLogs(e.uid))
      : deriveStatusFromLogs(e.uid);

    // last activity = latest among logs + requests
    const logMax = listEntityLogs(e.uid).at(-1)?.timestamp ?? null;
    const reqMax =
      [
        ...newEntityRequests.filter((r) => r.entityID === e.uid).map((r) => r.timestamp),
        ...moaRequests
          .filter((m) => m.entityID === e.uid && (!schoolId || m.schoolID === schoolId))
          .map((m) => m.timestamp),
      ]
        .sort()
        .at(-1) ?? null;

    const lastActivity = [logMax, reqMax].filter(Boolean).sort().at(-1) ?? null;

    return {
      id: e.uid,
      name: e.displayName,
      legalName: e.legalName,
      contactName: e.contactName,
      contactEmail: e.contactEmail,
      contactPhone: e.contactPhone,
      status: rel as CompanyStatus | null,
      lastActivity,
      noteCount: privateNotes.filter((n) => n.entityId === e.uid).length,
      documents: e.entityDocuments,
    };
  });

  return json({ total, items: rows });
}
