"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

type Stat = { label: string; value: number; color: string };
type Activity = { date: string; company: string; action: string; performedBy: string };

const columns: ColumnDef<Activity>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "performedBy", header: "Performed by" },
];

export default function UnivDashboardPage() {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);

  // Optional: if you know DLSU's schoolId, pass ?schoolId=...
  useEffect(() => {
    (async () => {
      const [s, a] = await Promise.all([
        fetch("/api/univ/dashboard/stats").then((r) => r.json()),
        fetch("/api/univ/dashboard/activity?days=180&limit=100").then((r) => r.json()),
      ]);
      setStats(s.stats);
      setActivities(a.activities);
    })();
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
        {(stats ?? []).map((stat) => (
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
          <DataTable columns={columns} data={activities ?? []} searchKey="company" />
        </CardContent>
      </Card>
    </div>
  );
}
