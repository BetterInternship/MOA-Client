// app/api/univ/companies/[id]/route.ts
import { json, notFound, badRequest } from "@/lib/api/utils";
import {
  findEntityById,
  listEntityLogs,
  listSchoolEntities,
  privateNotes,
  schools,
  moaRequests,
  newEntityRequests,
  schoolAccounts,
  entityLogs,
} from "@/lib/mock/db";
import type { EntityLog } from "@/types/db";

type CompanyStatus = "registered" | "approved" | "blacklisted";

// Same derivation helper (duplicated here for self-containment)
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

type Params = { id: string };

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;

  const { id } = await ctx.params; // Next.js 15: params is async
  const entity = findEntityById(id);
  if (!entity) return notFound("Entity not found");
  if (schoolId && !schools.find((s) => s.uid === schoolId)) return badRequest("Invalid schoolId");

  const status = schoolId
    ? (listSchoolEntities(schoolId).find((se) => se.entityId === entity.uid)?.status ??
      deriveStatusFromLogs(entity.uid))
    : deriveStatusFromLogs(entity.uid);

  const logs = listEntityLogs(entity.uid);

  const notes = privateNotes
    .filter((n) => n.entityId === entity.uid)
    .map((n) => ({
      id: n.id,
      authorId: n.authorId,
      authorName: schoolAccounts.find((a) => a.id === n.authorId)?.name ?? "Unknown",
      message: n.message,
      timestamp: n.timestamp,
    }));

  const requests = {
    newEntity: newEntityRequests
      .filter((r) => r.entityID === entity.uid)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    moa: moaRequests
      .filter((m) => m.entityID === entity.uid && (!schoolId || m.schoolID === schoolId))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  };

  return json({ entity, status, logs, notes, requests });
}
