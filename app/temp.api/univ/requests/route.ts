// app/api/univ/requests/route.ts
import { json, badRequest } from "@/lib/api/utils";
import { newEntityRequests, findEntityById, privateNotes, schoolAccounts } from "@/lib/mock/db";
import type { RequestResult } from "@/types/db";

// UI statuses
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
const safeLower = (v?: string | null) => (v ? v.toLowerCase() : "");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const statusFilter = searchParams.get("status") as UiStatus | null;

  if (Number.isNaN(limit) || Number.isNaN(offset))
    return badRequest("limit/offset must be numbers");

  // Enrich each request into the UI shape
  const enriched = newEntityRequests.map((r) => {
    const entity = findEntityById(r.entityID);
    const status = toStatus(r.resultAction);

    // Use latest private note (if any) as "reason" display
    const lastNote = privateNotes
      .filter((n) => n.entityId === r.entityID)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .at(-1);
    const reason = lastNote?.message ?? "";

    return {
      id: r.messageID,
      companyName: entity?.displayName ?? "Unknown",
      tin: undefined, // not modeled in mock
      contactPerson: entity?.contactName ?? "",
      email: entity?.contactEmail ?? "",
      industry: "", // not modeled
      submittedAt: fmt(r.timestamp),
      status,
      reason,
    };
  });

  // Search across companyName / contactPerson / industry
  const searched = q
    ? enriched.filter(
        (x) =>
          safeLower(x.companyName).includes(q) ||
          safeLower(x.contactPerson).includes(q) ||
          safeLower(x.industry).includes(q)
      )
    : enriched;

  const filtered = statusFilter ? searched.filter((x) => x.status === statusFilter) : searched;

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);

  return json({ total, items });
}
