import { json, badRequest, notFound } from "@/lib/api/utils";
import {
  moaRequests,
  entityAccounts,
  findEntityById,
} from "@/lib/mock/db";

type UiStatus = "Under Review" | "Approved" | "Denied" | "Needs Info";

// Map MoaRequest.resultAction -> friendly label
function toStatusLabel(
  r: (typeof moaRequests)[number]
): UiStatus {
  if (r.resultAction === "approved") return "Approved";
  if (r.resultAction === "denied") return "Denied";
  if (r.resultAction === "continuedDialogue") return "Needs Info";
  // not processed or no final action
  return "Under Review";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // In a real app, entityId comes from the logged-in session.
  // For mock/demo, allow override via ?entityId=… or default to the first mock entity account.
  const entityId =
    searchParams.get("entityId") ?? entityAccounts[0]?.entityId ?? null;

  if (!entityId) return badRequest("Missing entityId (and no mock account fallback available)");

  const entity = findEntityById(entityId);
  if (!entity) return notFound("Entity not found");

  const recentLimit = Math.max(1, Math.min(Number(searchParams.get("limit") ?? 5), 20));

  // Pull this entity's MOA requests
  const rows = moaRequests
    .filter((m) => m.entityID === entityId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const totalRequests = rows.length;
  // "Pending Actions" = items awaiting company input -> continuedDialogue
  const pendingActions = rows.filter((r) => r.resultAction === "continuedDialogue").length;

  // Build "recent activity" items
  const recent = rows
    .slice(-recentLimit)
    .reverse()
    .map((r) => ({
      id: r.messageID, // linkable id
      type: "Standard" as const, // not modeled in mock; default to "Standard"
      status: toStatusLabel(r),
      date: fmtDate(r.timestamp),
    }));

  const kpis = [
    { label: "Total MOA Requests", value: totalRequests, hint: "Includes Standard & Negotiated MOAs" },
    { label: "Pending Actions", value: pendingActions, hint: "Items awaiting your input" },
  ];

  return json({ kpis, recent });
}
