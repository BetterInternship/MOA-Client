// app/api/moa/status/route.ts
import { json, badRequest, notFound } from "@/lib/api/utils";
import { moaRequests, entityAccounts, findEntityById } from "@/lib/mock/db";

/** UI status for this page */
type UiStatus = "Approved" | "Pending" | "Rejected";

/** Map backend action -> UI status */
function toUiStatus(r: (typeof moaRequests)[number]): UiStatus {
  if (r.resultAction === "approved") return "Approved";
  if (r.resultAction === "denied") return "Rejected";
  // no action or continuedDialogue -> still pending on their side
  return "Pending";
}

function fmtLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // In a real app, entityId comes from auth/session.
  // For the mock, allow override via ?entityId=… or default to first mock account.
  const entityId = searchParams.get("entityId") ?? entityAccounts[0]?.entityId ?? null;
  if (!entityId) return badRequest("Missing entityId (no mock fallback available).");

  const entity = findEntityById(entityId);
  if (!entity) return notFound("Entity not found.");

  // Filter this company's requests, newest first
  const rows = moaRequests
    .filter((m) => m.entityID === entityId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .reverse();

  // Type isn’t modeled in the mock; default to "Standard"
  const items = rows.map((r) => ({
    id: r.messageID,
    company: entity.displayName,
    type: "Standard" as const,
    submitted: fmtLong(r.timestamp),
    status: toUiStatus(r),
  }));

  return json({ items });
}
