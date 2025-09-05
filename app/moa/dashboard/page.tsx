"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MoaActions from "@/components/moa/dashboard/MoaActions";
import MoaStatus from "@/components/moa/dashboard/MoaStatus";
import HistoryLog from "@/components/shared/HistoryLog";
import { EntityStatusSelf } from "@/components/moa/dashboard/EntityStatus";
import { Button } from "@/components/ui/button";

import { useMoaRequests, useMyEntityForSchool, DEFAULT_SCHOOL_ID } from "@/app/api/entity.api";
import { useSchoolPartner } from "@/app/api/school.api";

import type { MoaRequest } from "@/types/db";
import { cn } from "@/lib/utils";
import { MessageCircleWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MoaRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { requests: moaRequests, isLoading } = useMoaRequests();
  const { relationStatus } = useMyEntityForSchool();

  // Keep MOA requests in sync
  useEffect(() => {
    setRequests(moaRequests ?? []);
  }, [moaRequests, isLoading]);

  // Infer current entity from newest request (swap with your own source if you have one)
  const entityId = useMemo(() => {
    const latest = [...(moaRequests ?? [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    return latest?.entity_id ?? undefined;
  }, [moaRequests]);

  /* -------------------- Company Log (full history for entity) ------------------- */
  const {
    entity,
    history: partnerHistory, // { ...envelope, history: UiEntry[] }
    isLoadingHistory,
    error: historyError,
    refetchHistory,
  } = useSchoolPartner(entityId);

  const uiHistory = (partnerHistory?.history as any) ?? [];
  console.log(relationStatus);

  return (
    <div className="min-w-96 space-y-8">
      {/* Header */}
      {/* <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Dashboard</h1>
        {relationStatus !== "approved" && (
          <Badge type="destructive">
            Account not yet approved
            <MessageCircleWarning className="ml-2 h-4 w-4" />
          </Badge>
        )}
      </div> */}

      {/* One-card MOA status (transaction-level) */}
      <MoaStatus title="MOA Status" requests={requests} loading={loading} />

      {/* Entity status with the university (approved/pending/not-approved) */}
      {/* <EntityStatusSelf schoolId={DEFAULT_SCHOOL_ID} /> */}

      {/* Company Log */}
      {/* <div className="space-y-4">
        <h2 className="text-foreground text-2xl font-semibold">Company Log</h2>
        <HistoryLog showTitle={false} history={uiHistory} />
      </div> */}

      {/* Actions (only Standard / Negotiated) */}
      {/* // ! hide this eventually when not yet approved */}
      <div
        className={cn(
          "space-y-2",
          relationStatus === "approved" || relationStatus === "pending" ? "" : "invisible"
        )}
      >
        <MoaActions />
      </div>
    </div>
  );
}
