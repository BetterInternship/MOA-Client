// app/api/univ/moa-requests/route.ts
import { json, badRequest } from "@/lib/api/utils";
import {
  moaRequests,
  findEntityById,
  findSchoolById,
  listEntityLogs,
  privateNotes,
  schoolAccounts,
  schools,
  entityLogs,
} from "@/lib/mock/db";
import type { EntityLog, RequestResult } from "@/types/db";

type UiStatus = "Pending" | "Approved" | "Denied" | "Needs Info";

function mapActionToStatus(a?: RequestResult): UiStatus {
  switch (a) {
    case "approved":
      return "Approved";
    case "denied":
      return "Denied";
    case "continuedDialogue":
      return "Needs Info";
    default:
      return "Pending";
  }
}

const fmt = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

function historyFor(entityId: string, schoolShort?: string) {
  const logs = listEntityLogs(entityId);
  const items = logs.map((l) => ({
    date: fmt(l.timestamp),
    text: `${l.update} (${l.source} → ${l.target})`,
    files: l.file ? [l.file] : undefined,
  }));
  return items;
}

// Derive a coarse company status if needed (not used directly by this endpoint, but kept for parity)
function deriveStatusFromLogs(entityId: string) {
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

  if (!latest) return "Pending" as UiStatus;
  switch (latest.update) {
    case "approved":
      return "Approved";
    case "blacklisted":
    case "revoked":
      return "Denied"; // treat as "not approved" for request perspective
    case "registered":
    case "requested":
      return "Pending";
    default:
      return "Pending";
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const statusFilter = searchParams.get("status") as UiStatus | null;

  if (Number.isNaN(limit) || Number.isNaN(offset))
    return badRequest("limit/offset must be numbers");
  if (schoolId && !schools.find((s) => s.uid === schoolId)) return badRequest("Invalid schoolId");

  // Basic list
  let list = moaRequests.slice();

  // Scope to school if provided
  if (schoolId) list = list.filter((m) => m.schoolID === schoolId);

  // Enrich → UI shape
  const enriched = list.map((m) => {
    const entity = findEntityById(m.entityID);
    const school = findSchoolById(m.schoolID);
    const status = mapActionToStatus(m.resultAction);
    const contactPerson = entity?.contactName ?? "";
    const email = entity?.contactEmail ?? "";

    // Optional extra "notes" — take last private note as a one-liner
    const pn = privateNotes
      .filter((n) => n.entityId === m.entityID)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .at(-1);

    const hist = [
      { date: fmt(m.timestamp), text: `MOA Request received by ${school?.shortName ?? "School"}` },
      ...(m.processedDate
        ? [{ date: fmt(m.processedDate), text: `Request processed: ${status}` }]
        : []),
      ...historyFor(m.entityID, school?.shortName),
      ...(pn
        ? [
            {
              date: fmt(pn.timestamp),
              text: `Note by ${
                schoolAccounts.find((a) => a.id === pn.authorId)?.name ?? "Unknown"
              }: ${pn.message}`,
            },
          ]
        : []),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return {
      id: m.messageID,
      companyName: entity?.displayName ?? "Unknown",
      tin: undefined, // not modeled in mock
      contactPerson,
      email,
      industry: "", // not modeled; leave blank to show "—"
      requestedAt: fmt(m.timestamp),
      status,
      notes: pn?.message,
      history: hist,
    };
  });

  // Search client-side fields: companyName, contactPerson, industry
  const searched = q
    ? enriched.filter(
        (r) =>
          r.companyName.toLowerCase().includes(q) ||
          r.contactPerson.toLowerCase().includes(q) ||
          (r.industry ?? "").toLowerCase().includes(q)
      )
    : enriched;

  const filtered = statusFilter ? searched.filter((r) => r.status === statusFilter) : searched;

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);

  return json({ total, items });
}
