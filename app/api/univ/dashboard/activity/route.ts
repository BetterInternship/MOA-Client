import { json, badRequest } from "@/lib/api/utils";
import {
  entities,
  entityLogs,
  newEntityRequests,
  moaRequests,
  schools,
  schoolAccounts,
} from "@/lib/mock/db";

function byId<T extends { uid?: string }>(arr: any[], id?: string) {
  return id ? arr.find((x) => x.uid === id) : undefined;
}
const entityName = (id?: string) => {
  const e = id ? entities.find((x) => x.uid === id) : null;
  return e?.displayName ?? "Unknown Entity";
};
const accountName = (id?: string) =>
  (id ? schoolAccounts.find((a) => a.id === id)?.name : undefined) ?? "System";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const days = Number(searchParams.get("days") ?? 90);
  const limit = Number(searchParams.get("limit") ?? 50);

  if (Number.isNaN(days) || Number.isNaN(limit)) return badRequest("days/limit must be numbers");

  const now = new Date();
  const after = new Date();
  after.setDate(now.getDate() - days);

  type Activity = { date: string; company: string; action: string; performedBy: string };

  // From entity logs
  const fromLogs: Activity[] = entityLogs
    .filter((l) => {
      const t = new Date(l.timestamp);
      if (t < after || t > now) return false;
      if (schoolId) {
        // keep logs that targeted the selected school (using short name)
        const schoolShort = schools.find((s) => s.uid === schoolId)?.shortName;
        if (!schoolShort || l.target !== schoolShort) return false;
      }
      return true;
    })
    .map((l) => ({
      date: new Date(l.timestamp).toISOString(),
      company: entityName(l.entityId),
      action:
        l.update === "note"
          ? "Note added"
          : l.update === "requested"
            ? "Request created"
            : l.update.charAt(0).toUpperCase() + l.update.slice(1),
      performedBy:
        l.source === "school"
          ? schoolId
            ? (schools.find((s) => s.uid === schoolId)?.shortName ?? "School")
            : "School"
          : "Company",
    }));

  // From new entity requests
  const fromNewCompanies: Activity[] = newEntityRequests
    .filter((r) => {
      const t = new Date(r.timestamp);
      return t >= after && t <= now;
    })
    .map((r) => ({
      date: new Date(r.timestamp).toISOString(),
      company: entityName(r.entityID),
      action: "Company Registration Submitted",
      performedBy: accountName(r.processedBy) || "Applicant",
    }));

  // From MOA requests
  const fromMoa: Activity[] = moaRequests
    .filter((m) => {
      if (schoolId && m.schoolID !== schoolId) return false;
      const t = new Date(m.timestamp);
      return t >= after && t <= now;
    })
    .map((m) => ({
      date: new Date(m.timestamp).toISOString(),
      company: entityName(m.entityID),
      action: "MOA Request Received",
      performedBy: accountName(m.processedBy) || "Requestor",
    }));

  const merged = [...fromLogs, ...fromNewCompanies, ...fromMoa]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    // format to your table shape (MM/DD/YYYY)
    .map((x) => ({
      date: new Date(x.date).toLocaleDateString("en-US"),
      company: x.company,
      action: x.action,
      performedBy: x.performedBy,
    }));

  return json({ activities: merged });
}
