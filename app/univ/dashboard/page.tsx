"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

const stats = [
  { label: "New Companies", value: 21, color: "bg-green-600" },
  { label: "MOA Requests", value: 12, color: "bg-orange-500" },
  { label: "Total Companies", value: 1249, color: "bg-gray-200 text-gray-900" },
  { label: "Active MOAs", value: 1023, color: "bg-blue-700" },
];

type Activity = {
  date: string;
  company: string;
  action: string;
  performedBy: string;
};

const activities: Activity[] = [
  {
    date: "12/02/2024",
    company: "Aurora Systems",
    action: "Company Registration Submitted",
    performedBy: "Isabel Reyes",
  },
  {
    date: "01/15/2025",
    company: "GreenFields Manufacturing",
    action: "MOA Request (Standard) Received",
    performedBy: "Carlos Mendoza",
  },
  {
    date: "01/18/2025",
    company: "GreenFields Manufacturing",
    action: "Initial Review Completed",
    performedBy: "DLSU - OJT Coordinator",
  },
  {
    date: "02/01/2025",
    company: "Northbridge Finance",
    action: "MOA Request (Negotiated) Submitted",
    performedBy: "Katrina Uy",
  },
  {
    date: "02/05/2025",
    company: "Northbridge Finance",
    action: "Legal Review Started",
    performedBy: "DLSU Legal",
  },
];

const columns: ColumnDef<Activity>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "performedBy", header: "Performed by" },
];

export default function UnivDashboardPage() {
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
