// app/api/univ/moa-requests/[id]/request-info/route.ts
import { json, notFound, badRequest } from "@/lib/api/utils";
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

  // derive simple history (latest note included)
  const hist = [
    { date: fmt(m.timestamp), text: `MOA Request received by ${school?.shortName ?? "School"}` },
    ...(m.processedDate
      ? [{ date: fmt(m.processedDate), text: `Request processed: ${status}` }]
      : []),
  ];

  // Collect notes for history tail
  const notes = privateNotes
    .filter((n) => n.entityId === m.entityID)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const lastNote = notes.at(-1);
  if (lastNote) {
    hist.push({
      date: fmt(lastNote.timestamp),
      text: `Note by ${schoolAccounts.find((a) => a.id === lastNote.authorId)?.name ?? "Unknown"}: ${
        lastNote.message
      }`,
    });
  }

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
    history: hist,
  };
}

type Params = { id: string };

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { message?: string };
  const row = moaRequests.find((m) => m.messageID === id);
  if (!row) return notFound("MOA request not found");

  // mark as continued dialogue ("Needs Info")
  row.resultAction = "continuedDialogue";
  row.processedDate = new Date().toISOString();
  row.processedBy = row.notifySchoolAccount ?? row.processedBy;

  // Add a private note with the message (if any)
  if (body.message?.trim()) {
    privateNotes.push({
      id: randomUUID(),
      authorId:
        row.processedBy ??
        schoolAccounts.find((a) => a.schoolId === row.schoolID)?.id ??
        schoolAccounts[0]?.id,
      entityId: row.entityID,
      message: body.message.trim(),
      timestamp: new Date().toISOString(),
    });
  }

  // Append an entity log entry to reflect the action
  appendEntityLog({
    update: "requested",
    source: "school",
    target: findSchoolById(row.schoolID)?.shortName ?? "School",
    file: null,
    entityId: row.entityID,
  });

  return json({ item: toUi(row) });
}
