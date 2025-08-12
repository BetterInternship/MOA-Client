// app/api/univ/moa-requests/[id]/deny/route.ts
import { json, notFound } from "@/lib/api/utils";
import {
  moaRequests,
  findEntityById,
  findSchoolById,
  privateNotes,
  schoolAccounts,
  appendEntityLog,
} from "@/lib/mock/db";
import { randomUUID } from "crypto";
import type { RequestResult } from "@/types/db";

type UiStatus = "Pending" | "Approved" | "Denied" | "Needs Info";
const toStatus = (a?: RequestResult): UiStatus =>
  a === "approved"
    ? "Approved"
    : a === "denied"
      ? "Denied"
      : a === "continuedDialogue"
        ? "Needs Info"
        : "Pending";
const fmt = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

function toUi(m: (typeof moaRequests)[number]) {
  const entity = findEntityById(m.entityID);
  const school = findSchoolById(m.schoolID);
  const status = toStatus(m.resultAction);

  const notes = privateNotes
    .filter((n) => n.entityId === m.entityID)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const lastNote = notes.at(-1);

  return {
    id: m.messageID,
    companyName: entity?.displayName ?? "Unknown",
    tin: undefined,
    contactPerson: entity?.contactName ?? "",
    email: entity?.contactEmail ?? "",
    industry: "",
    requestedAt: fmt(m.timestamp),
    status,
    notes: lastNote?.message,
    history: [
      { date: fmt(m.timestamp), text: `MOA Request received by ${school?.shortName ?? "School"}` },
      ...(m.processedDate
        ? [{ date: fmt(m.processedDate), text: `Request processed: ${status}` }]
        : []),
    ],
  };
}

type Params = { id: string };

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  const { note } = (await req.json().catch(() => ({}))) as { note?: string };

  const row = moaRequests.find((m) => m.messageID === id);
  if (!row) return notFound("MOA request not found");

  row.resultAction = "denied";
  row.processedDate = new Date().toISOString();
  row.processedBy = row.notifySchoolAccount ?? row.processedBy;

  if (note?.trim()) {
    privateNotes.push({
      id: randomUUID(),
      authorId:
        row.processedBy ??
        schoolAccounts.find((a) => a.schoolId === row.schoolID)?.id ??
        schoolAccounts[0]?.id,
      entityId: row.entityID,
      message: note.trim(),
      timestamp: new Date().toISOString(),
    });
  }

  // Log as a generic note for visibility
  appendEntityLog({
    update: "note",
    source: "school",
    target: findSchoolById(row.schoolID)?.shortName ?? "School",
    file: null,
    entityId: row.entityID,
  });

  return json({ item: toUi(row) });
}
