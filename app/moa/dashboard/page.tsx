"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MoaActions from "@/components/moa/dashboard/MoaActions";
import MoaStatus from "@/components/moa/dashboard/MoaStatus";
import HistoryLog from "@/components/shared/HistoryLog";
import EntityStatus from "@/components/moa/dashboard/EntityStatus";
import { Button } from "@/components/ui/button";

import { useMoaRequests, useMyEntityForSchool } from "@/app/api/entity.api";
import { useSchoolPartner } from "@/app/api/school.api";

import type { MoaRequest } from "@/types/db";
import { cn } from "@/lib/utils";
import { MessageCircleWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ----------------------------- local helpers ----------------------------- */

function toEntityApprovalStatus(
  outcome?: string | null,
  hasAnyRecord = false
): "approved" | "pending" | "not-approved" {
  const s = (outcome ?? "").toLowerCase();
  if (!s && !hasAnyRecord) return "not-approved";
  if (s === "approved" || s === "active" || s === "valid") return "approved";
  if (s === "denied" || s === "rejected" || s === "not-approved") return "not-approved";
  return "pending"; // pending / waiting-* / unknown non-final
}

const DEFAULT_SCHOOL_ID = "0fde7360-7c13-4d27-82e9-7db8413a08a5";

/* ------------------- small Suspense-fed EntityStatus card ------------------ */

function EntityStatusSelfCard({ schoolId }: { schoolId?: string }) {
  const { entity, relationStatus, isLoading } = useMyEntityForSchool();

  if (relationStatus === "approved") return <></>;

  return (
    <EntityStatus
      entityName={entity?.legal_identifier ?? "-"}
      status={relationStatus}
      loading={isLoading}
    />
  );
}

/* ---------------------------------- page --------------------------------- */

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

  return (
    <div className="min-w-96 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Dashboard</h1>
        {relationStatus !== "approved" && (
          <Badge type="destructive">
            Account not yet approved
            <MessageCircleWarning className="ml-2 h-4 w-4" />
          </Badge>
        )}
      </div>

      {/* One-card MOA status (transaction-level) */}
      <MoaStatus title="MOA Status" requests={requests} loading={loading} />

      {/* Entity status with the university (approved/pending/not-approved) via entity.api (Suspense) */}
      <EntityStatusSelfCard schoolId={DEFAULT_SCHOOL_ID} />

      {/* Company Log */}
      {/* <div className="space-y-4">
        <h2 className="text-foreground text-2xl font-semibold">Company Log</h2>

        <HistoryLog showTitle={false} history={uiHistory} />
      </div> */}

      {/* Actions (only Standard / Negotiated) */}
      <div className={cn("space-y-2", relationStatus === "approved" ? "" : "invisible")}>
        <MoaActions />
      </div>
    </div>
  );
}
