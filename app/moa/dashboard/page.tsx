// app/moa/(dashboard)/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MoaActions from "@/components/moa/dashboard/MoaActions";
import MoaStatus from "@/components/moa/dashboard/MoaStatus";
import CompanyRequestHistory from "@/components/univ/shared/CompanyRequestHistory";
import { useMoaRequests } from "@/app/api/entity.api";
import { MoaRequest } from "@/types/db";

export default function DashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MoaRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const moaRequests = useMoaRequests();

  useEffect(() => {
    setRequests(moaRequests.requests ?? []);
  }, [moaRequests]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-semibold">Home</h1>
        <p className="text-muted-foreground text-sm">
          Start a new MOA or track the status of your requests.
        </p>
      </div>

      {/* One-card MOA status */}
      <MoaStatus title="MOA Status" requests={requests} loading={loading} />

      {/* Actions (only Standard / Negotiated) */}
      <MoaActions
        onStandard={() => router.push("/dashboard/request/standard")}
        onNegotiated={() => router.push("/dashboard/request/negotiated")}
      />

      {/* MOA Log */}
      <div className="space-y-4">
        <h2 className="text-foreground text-2xl font-semibold">Company Log</h2>
        <CompanyRequestHistory showTitle={false} />
      </div>
    </div>
  );
}
