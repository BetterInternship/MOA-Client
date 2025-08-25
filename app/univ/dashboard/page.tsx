"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import CustomCard from "@/components/shared/CustomCard";
import { Badge } from "@/components/ui/badge";
import {
  useSchoolStats,
  useSchoolCompanyRequests,
  useSchoolActiveMoas,
  CompanyRequest,
} from "@/app/api/school.api";

type Stat = {
  label: string;
  value: number;
  color: "supportive" | "primary" | "warning" | "destructive";
};

type Activity = { date: string; company: string; action: string; performedBy: string };

const columns: ColumnDef<Activity>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "company", header: "Company" },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "performedBy", header: "Performed by" },
];


export default function UnivDashboardPage() {
  const statsQ = useSchoolStats();
  const requestsQ = useSchoolCompanyRequests({ offset: 0, limit: 100 });
  const pendingEntityRequests = useMemo(() => {
    const reqs = requestsQ.data ?? [];
    const hasOutcome = reqs.some((r) => r.outcome !== undefined);
    return hasOutcome
      ? reqs.filter((r) => (r.outcome ?? "pending") === "pending").length
      : reqs.length;
  }, [requestsQ.data]);

  const stats: Stat[] = useMemo(
    () => [
      { label: "Active MOAs", value: statsQ.data?.activeMoas ?? 0, color: "supportive" },
      { label: "Pending MOA Requests", value: statsQ.data?.pendingMoas ?? 0, color: "warning" },
      {
        label: "Entities Registered",
        value: statsQ.data?.registeredEntities ?? 0,
        color: "primary",
      },
      { label: "Pending Entity Requests", value: pendingEntityRequests ?? 0, color: "destructive" },
    ],
    [statsQ.data, pendingEntityRequests]
  );

  const loading = statsQ.isLoading || requestsQ.isLoading

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">DLSU MOA Management Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of MOA requests, entity registrations, and activity logs.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <CustomCard
            key={stat.label}
            className="flex flex-col items-center justify-center border bg-white p-6"
          >
            <div className="mb-2 font-mono text-4xl font-bold tracking-tight text-slate-600">
              {loading ? "—" : stat.value}
            </div>
            <Badge type={stat.color}>{stat.label}</Badge>
          </CustomCard>
        ))}
      </div>

      {/* Activity Data Table */}
      <CustomCard className="space-y-2">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div>
          <DataTable columns={columns} data={[]} searchKey="company" />
        </div>
      </CustomCard>
    </div>
  );
}
