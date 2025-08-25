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
  useSchoolActiveMoasCount,
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
  // counts
  const statsQ = useSchoolStats();
  // list of requests (to get pending entity requests + build "Recent Activity")
  const requestsQ = useSchoolCompanyRequests({ offset: 0, limit: 50 });
  // “Active MOAs” count (derived from list length)
  const activeMoasQ = useSchoolActiveMoasCount();

  const pendingEntityRequests = useMemo(() => {
    const reqs = requestsQ.data ?? [];
    // if outcome exists, count only 'pending'; else fall back to list length
    const hasOutcome = reqs.some((r) => r.outcome !== undefined);
    return hasOutcome
      ? reqs.filter((r) => (r.outcome ?? "pending") === "pending").length
      : reqs.length;
  }, [requestsQ.data]);

  const stats: Stat[] = useMemo(
    () => [
      { label: "Active MOAs", value: activeMoasQ.count, color: "supportive" },
      { label: "Pending MOA Requests", value: statsQ.data?.pendingMoas ?? 0, color: "warning" },
      {
        label: "Entities Registered",
        value: statsQ.data?.registeredEntities ?? 0,
        color: "primary",
      },
      { label: "Pending Entity Requests", value: pendingEntityRequests ?? 0, color: "destructive" },
    ],
    [activeMoasQ.count, statsQ.data, pendingEntityRequests]
  );

  const activities: Activity[] = useMemo(() => {
    const reqs = (requestsQ.data ?? []) as CompanyRequest[];
    return reqs.slice(0, 10).map((r) => ({
      date: toMDY(r.timestamp || r.processed_date || ""),
      company: r.entity_id?.slice(0, 8) || "(unknown entity)",
      action:
        r.outcome === "approved"
          ? "Company Request Approved"
          : r.outcome === "denied"
            ? "Company Request Denied"
            : "Company Request Submitted",
      performedBy: r.processed_by_account_id
        ? `Acct ${r.processed_by_account_id.slice(0, 6)}`
        : "—",
    }));
  }, [requestsQ.data]);

  const loading = statsQ.isLoading || requestsQ.isLoading || activeMoasQ.isLoading;

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
          <DataTable columns={columns} data={activities} searchKey="company" />
        </div>
      </CustomCard>
    </div>
  );
}
