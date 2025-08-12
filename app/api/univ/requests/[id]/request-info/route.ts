// app/api/univ/requests/[id]/request-info/route.ts
import { json, notFound } from "@/lib/api/utils";
import {
  newEntityRequests,
  findEntityById,
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

function toUi(r: (typeof newEntityRequests)[number]) {
  const entity = findEntityById(r.entityID);
  const lastNote = privateNotes
    .filter((n) => n.entityId === r.entityID)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .at(-1);

  return {
    id: r.messageID,
    companyName: entity?.displayName ?? "Unknown",
    tin: undefined,
    contactPerson: entity?.contactName ?? "",
    email: entity?.contactEmail ?? "",
    industry: "",
    submittedAt: fmt(r.timestamp),
    status: toStatus(r.resultAction),
    reason: lastNote?.message ?? "",
  };
}

type Params = { id: string };

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  const { message } = (await req.json().catch(() => ({}))) as { message?: string };

  const row = newEntityRequests.find((x) => x.messageID === id);
  if (!row) return notFound("Request not found");

  // Mark as "Needs Info"
  row.resultAction = "continuedDialogue";
  row.processedDate = new Date().toISOString();
  // processedBy is optional; pick any known school account as actor for mock
  row.processedBy = row.processedBy ?? schoolAccounts[0]?.id;

  if (message?.trim()) {
    privateNotes.push({
      id: randomUUID(),
      authorId: row.processedBy ?? schoolAccounts[0]?.id,
      entityId: row.entityID,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });
  }

  // Log the action at the entity level (generic note)
  appendEntityLog({
    update: "note",
    source: "school",
    target: "University",
    file: null,
    entityId: row.entityID,
  });

  return json({ item: toUi(row) });
}
