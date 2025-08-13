// app/api/univ/moa-requests/route.ts
import { NextResponse } from "next/server";
import { moaRequests, findEntityById, entityLogs } from "@/lib/mock/db";
import type { MoaRequest as FrontMoa } from "@/types/moa-request";

function toStatus(
  resultAction?: "approved" | "denied" | "continuedDialogue",
  processedBy?: string
): FrontMoa["status"] {
  if (!processedBy) return "Pending";
  if (resultAction === "approved") return "Approved";
  if (resultAction === "denied") return "Denied";
  return "Needs Info";
}

function toMDY(iso?: string | null) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function buildHistory(entityId: string) {
  const logs = entityLogs
    .filter((l) => l.entityId === entityId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-5);
  return logs.map((l) => ({
    date: toMDY(l.timestamp),
    text:
      l.update === "requested"
        ? "MOA requested"
        : l.update === "approved"
          ? "MOA approved"
          : l.update === "blacklisted"
            ? "Entity blacklisted"
            : l.update === "registered"
              ? "Entity registered"
              : "Update",
    files: l.file
      ? [{ id: l.uuid, name: l.file.split("/").pop() ?? "document.pdf", url: l.file }]
      : undefined,
    sourceType: l.source === "school" ? "univ" : "company",
  }));
}

function toFront(row: (typeof moaRequests)[number]): FrontMoa {
  const e = findEntityById(row.entityID);
  const status = toStatus(row.resultAction, row.processedBy);
  const notes = (row as any).notes as string | undefined;
  const history = ((row as any).history ?? []) as FrontMoa["history"];

  return {
    id: row.messageID,
    entityId: row.entityID,
    companyName: e?.displayName ?? "—",
    contactPerson: e?.contactName ?? undefined,
    email: e?.contactEmail ?? undefined,
    tin: e?.legalIdentifier ?? undefined,
    industry: undefined,
    requestedAt: row.timestamp,
    status,
    notes,
    history: Array.isArray(history) && history.length ? history : buildHistory(row.entityID),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase();
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const include = (url.searchParams.get("include") ?? "outstanding").toLowerCase();

  let all = moaRequests.map(toFront).filter((r) => {
    if (!q) return true;
    return (
      r.companyName.toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.tin ?? "").toLowerCase().includes(q)
    );
  });

  if (include !== "all") {
    all = all.filter((r) => r.status === "Pending" || r.status === "Needs Info");
  }

  const items = all.slice(offset, offset + limit);
  return NextResponse.json(
    { total: all.length, items },
    { headers: { "Cache-Control": "no-store" } }
  );
}
