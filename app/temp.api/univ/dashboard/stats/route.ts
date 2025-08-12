import { json, badRequest } from "@/lib/api/utils";
import { entities, newEntityRequests, moaRequests, signedDocuments } from "@/lib/mock/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;

  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };
  const inLastDays = (iso?: string | null, n = 30) =>
    !!iso && new Date(iso) >= daysAgo(n) && new Date(iso) <= now;

  // New Companies (submitted requests in last 30 days)
  const newCompanies = newEntityRequests.filter((r) => inLastDays(r.timestamp)).length;

  // MOA Requests (optionally filter to school)
  const moaReqs = moaRequests.filter((m) => {
    if (schoolId && m.schoolID !== schoolId) return false;
    return inLastDays(m.timestamp);
  }).length;

  // Total Companies
  const totalCompanies = entities.length;

  // Active MOAs (time-valid signed documents)
  const activeMoas = signedDocuments.filter((d) => {
    const eff = d.effective_date ? new Date(d.effective_date) : null;
    const exp = d.expiry_date ? new Date(d.expiry_date) : null;
    if (!eff) return false;
    const started = eff <= now;
    const notExpired = !exp || exp > now;
    return started && notExpired;
  }).length;

  return json({
    stats: [
      { label: "New Companies", value: newCompanies, color: "bg-green-600" },
      { label: "MOA Requests", value: moaReqs, color: "bg-orange-500" },
      { label: "Total Companies", value: totalCompanies, color: "bg-gray-200 text-gray-900" },
      { label: "Active MOAs", value: activeMoas, color: "bg-blue-700" },
    ],
  });
}
