// app/moa/(dashboard)/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MoaActions from "@/components/moa/dashboard/MoaActions";
import MoaStatus from "@/components/moa/dashboard/MoaStatus";
import HistoryLog from "@/components/shared/HistoryLog";
import { useMoaRequests } from "@/app/api/entity.api";
import { MoaRequest } from "@/types/db";

export default function DashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MoaRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { requests: moaRequests, isLoading } = useMoaRequests();

  useEffect(() => {
    setRequests(moaRequests ?? []);
  }, [isLoading]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* One-card MOA status */}
      <MoaStatus title="MOA Status" requests={requests} loading={loading} />

      {/* Actions (only Standard / Negotiated) */}
      <div className="space-y-2">
        <MoaActions />
      </div>

      {/* MOA Log */}
      <div className="space-y-4">
        <h2 className="text-foreground text-2xl font-semibold">Company Log</h2>
        <HistoryLog showTitle={false} history={[]} />
      </div>
    </div>
  );
}
