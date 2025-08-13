
// app/api/univ/dashboard/activity/route.ts
import { NextResponse } from "next/server";
import { DemoStore } from "@/lib/demo-store";

export type Activity = {
  date: string;       // MM/DD/YYYY
  company: string;
  action: string;
  performedBy: string;
};

// small util for dates
function toMDY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toMDY(d);
}

// baseline rows so the table isn’t empty
const BASE_ACTIVITIES: Activity[] = [
  { date: daysAgo(3), company: "Aboitiz Power Corporation", action: "MOA Approved", performedBy: "Legal – DLSU" },
  { date: daysAgo(4), company: "Globe Telecom", action: "Requested Clarification", performedBy: "Approver – DLSU" },
  { date: daysAgo(5), company: "Jollibee Foods Corp.", action: "Company Registered", performedBy: "Admin – DLSU" },
  { date: daysAgo(6), company: "Accenture", action: "MOA Uploaded", performedBy: "Company Rep" },
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? "180");
  const limit = Number(url.searchParams.get("limit") ?? "100");

  const { stage, signatory } = DemoStore.get();

  const today = toMDY(new Date());
  const demoCompany = "Demo Company Inc."; // keep consistent with your company-side history

  // Stage-based demo rows (always most recent first)
  const demoRows: Activity[] =
    stage === 0
      ? []
      : stage === 1
      ? [
          {
            date: today,
            company: demoCompany,
            action: `MOA Submitted (Standard) — ${signatory.name || "—"} (${signatory.title || "—"})`,
            performedBy: "Company Rep",
          },
          {
            date: today,
            company: demoCompany,
            action: "MOA Received — Under Review",
            performedBy: "Approver – DLSU",
          },
        ]
      : [
          {
            date: today,
            company: demoCompany,
            action: "MOA Approved",
            performedBy: "Legal – DLSU",
          },
          {
            date: today,
            company: demoCompany,
            action: `MOA Submitted (Standard) — ${signatory.name || "—"} (${signatory.title || "—"})`,
            performedBy: "Company Rep",
          },
          {
            date: today,
            company: demoCompany,
            action: "MOA Received — Under Review",
            performedBy: "Approver – DLSU",
          },
        ];

  // Merge and trim by limit & pseudo-days (we’re not storing real timestamps for base rows)
  const activities = [...demoRows, ...BASE_ACTIVITIES].slice(0, Math.max(1, limit));

  return NextResponse.json(
    { activities },
    { headers: { "Cache-Control": "no-store" } }
  );
}
