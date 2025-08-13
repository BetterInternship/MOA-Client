// app/api/univ/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { DemoStore } from "@/lib/demo-store";

export type Stat = { label: string; value: number; color: string };

// base numbers for show — tweak as you wish
const BASE: Record<string, number> = {
  active: 18,
  pending: 7,
  registered: 124,
  underReview: 2,
};

export async function GET() {
  const { stage } = DemoStore.get();

  // Clone base so we don’t mutate the constant
  const s = { ...BASE };

  // Adjust based on demo stage (keep it simple & predictable)
  if (stage === 1) {
    s.pending += 1; // new submission
    s.underReview += 1; // it’s under review now
  } else if (stage === 2) {
    s.active += 1; // it got approved
  }

  const stats: Stat[] = [
    { label: "Active MOAs", value: s.active, color: "bg-emerald-600" },
    { label: "Pending MOA Requests", value: s.pending, color: "bg-amber-500" },
    { label: "Companies Registered", value: s.registered, color: "bg-blue-600" },
    { label: "Under Review", value: s.underReview, color: "bg-rose-500" },
  ];

  return NextResponse.json({ stats }, { headers: { "Cache-Control": "no-store" } });
}
