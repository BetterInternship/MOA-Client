"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

// import { useEntities } from "@/app/api/school.api"; // keep if you'll use later

type Stat = { label: string; value: number; color: string };
type Activity = { date: string; company: string; action: string; performedBy: string };

const columns: ColumnDef<Activity>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "performedBy", header: "Performed by" },
];

// ---- Inline dummy data (rendered immediately, replaced after fetch) ----
const DUMMY_STATS: Stat[] = [
  { label: "Active MOAs", value: 18, color: "bg-emerald-600" },
  { label: "Pending MOA Requests", value: 7, color: "bg-amber-500" },
  { label: "Companies Registered", value: 124, color: "bg-blue-600" },
  { label: "Under Review", value: 2, color: "bg-rose-400 text-rose-100" },
];

const DUMMY_ACTIVITIES: Activity[] = [
  {
    date: "08/10/2025",
    company: "Aboitiz Power Corporation",
    action: "MOA Approved",
    performedBy: "Legal - DLSU",
  },
  {
    date: "08/09/2025",
    company: "Globe Telecom",
    action: "Requested Clarification",
    performedBy: "Approver - DLSU",
  },
  {
    date: "08/08/2025",
    company: "Jollibee Foods Corp.",
    action: "Company Registered",
    performedBy: "Admin - DLSU",
  },
  { date: "08/07/2025", company: "Accenture", action: "MOA Uploaded", performedBy: "Company Rep" },
];

export default function UnivDashboardPage() {
  const [stats, setStats] = useState<Stat[]>(DUMMY_STATS);
  const [activities, setActivities] = useState<Activity[]>(DUMMY_ACTIVITIES);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          fetch("/api/univ/dashboard/stats"),
          fetch("/api/univ/dashboard/activity?days=180&limit=100"),
        ]);

        if (sRes.ok) {
          const sJson = await sRes.json();
          // Expecting { stats: Stat[] }, fallback safely
          const nextStats: Stat[] =
            Array.isArray(sJson?.stats) && sJson.stats.length ? sJson.stats : DUMMY_STATS;
          if (alive) setStats(nextStats);
        }

        if (aRes.ok) {
          const aJson = await aRes.json();
          // Expecting { activities: Activity[] }, fallback safely
          const nextActivities: Activity[] =
            Array.isArray(aJson?.activities) && aJson.activities.length
              ? aJson.activities
              : DUMMY_ACTIVITIES;
          if (alive) setActivities(nextActivities);
        }
      } catch (err) {
        // Keep dummy data if network/API fails
        console.error("Dashboard fetch error:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">DLSU MOA Management Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of MOA requests, company registrations, and activity logs.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center rounded-lg border bg-white p-6"
          >
            <div className="text-4xl font-bold text-slate-600">{stat.value}</div>
            <span
              className={`mt-2 rounded-md px-3 py-1 text-sm font-medium ${
                stat.color.includes("bg-gray") ? stat.color : `${stat.color} text-white`
              }`}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Activity Data Table */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={activities} searchKey="company" />
        </CardContent>
      </Card>
    </div>
  );
}
