// app/univ/(dashboard)/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DemoRT } from "@/lib/demo-realtime";

// ── Types aligned with your API handlers ─────────────────────────────────────
type Stat = { label: string; value: number; color: string };
type Activity = { date: string; company: string; action: string; performedBy: string };

// ── Table columns ────────────────────────────────────────────────────────────
const columns: ColumnDef<Activity>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "performedBy", header: "Performed by" },
];

// ── Safe immediate UI while API loads (same look as before) ──────────────────
const DUMMY_STATS: Stat[] = [
  { label: "Active MOAs", value: 18, color: "bg-emerald-600" },
  { label: "Pending MOA Requests", value: 7, color: "bg-amber-500" },
  { label: "Companies Registered", value: 124, color: "bg-blue-600" },
  { label: "Under Review", value: 2, color: "bg-rose-500" },
];

const DUMMY_ACTIVITIES: Activity[] = [
  {
    date: "08/10/2025",
    company: "Aboitiz Power Corporation",
    action: "MOA Approved",
    performedBy: "Legal – DLSU",
  },
  {
    date: "08/09/2025",
    company: "Globe Telecom",
    action: "Requested Clarification",
    performedBy: "Approver – DLSU",
  },
  {
    date: "08/08/2025",
    company: "Jollibee Foods Corp.",
    action: "Company Registered",
    performedBy: "Admin – DLSU",
  },
  { date: "08/07/2025", company: "Accenture", action: "MOA Uploaded", performedBy: "Company Rep" },
];

export default function UnivDashboardPage() {
  const [stats, setStats] = useState<Stat[]>(DUMMY_STATS);
  const [activities, setActivities] = useState<Activity[]>(DUMMY_ACTIVITIES);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [sRes, aRes] = await Promise.all([
        fetch("/api/univ/dashboard/stats", { cache: "no-store" }),
        fetch("/api/univ/dashboard/activity?days=180&limit=100", { cache: "no-store" }),
      ]);

      if (sRes.ok) {
        const sj = await sRes.json();
        if (Array.isArray(sj?.stats) && sj.stats.length) setStats(sj.stats);
      }
      if (aRes.ok) {
        const aj = await aRes.json();
        if (Array.isArray(aj?.activities) && aj.activities.length) setActivities(aj.activities);
      }
    } catch (e) {
      // keep dummies on error
      console.error("Univ dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    load();

    // realtime: react to company submit / uni approve
    DemoRT.onStage(() => alive && load());

    // refresh when tab regains focus (handy during demos)
    const onVis = () => document.visibilityState === "visible" && alive && load();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

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
            <div className="text-4xl font-bold text-slate-600">{loading ? "…" : stat.value}</div>
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
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          {/* Optional: quick dev reset */}
          {/* <Button variant="outline" size="sm" onClick={async () => { await fetch("/api/moa/reset", { method: "POST" }); DemoRT.sendStage(0 as any); load(); }}>
            Reset Demo
          </Button> */}
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={activities} searchKey="company" />
        </CardContent>
      </Card>
    </div>
  );
}
