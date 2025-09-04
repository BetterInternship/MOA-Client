"use client";

import { useEffect, useMemo, useState } from "react";
import CustomCard from "@/components/shared/CustomCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatWhen } from "@/lib/format";
import { ShieldCheck, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * EntityStatus
 * Displays whether an entity (company) is approved with the university, pending, or not approved.
 *
 * Example:
 * <EntityStatus
 *   entityName="Acme Corp"
 *   status="approved"
 *   approvedAt="2025-08-01T00:00:00Z"
 *   expiryAt="2026-07-31T23:59:59Z"
 * />
 */

export type EntityApprovalStatus = "approved" | "pending" | "not-approved";

type Props = {
  /**
   * Current approval status of the entity relative to the university.
   * Supported: "approved" | "pending" | "not-approved" (fallbacks gracefully for unknown strings)
   */
  status?: EntityApprovalStatus | string | null;
  /** Optional: Entity display name for context */
  entityName?: string;
  /** If pending, when the request was filed */
  requestedAt?: string;
  /** If approved, when approval became effective */
  approvedAt?: string;
  /** If approved, when the approval expires */
  expiryAt?: string | Date | null;
  /** Loading state shows a subtle skeleton */
  loading?: boolean;
  /** Compact mode trims descriptions and spacing (for list rows, sidebars, etc.) */
  compact?: boolean;
  /** Extra className for the outer card */
  className?: string;
};

const toneByStatus: Record<string, string> = {
  approved: "bg-supportive/5 border-supportive",
  pending: "bg-warning/5 border-warning",
  "not-approved": "bg-destructive/5 border-destructive",
};

const titleByStatus: Record<string, string> = {
  approved: "Approved with the University",
  pending: "Pending University Approval",
  "not-approved": "Not Approved",
};

const blurbByStatus: Record<string, string> = {
  approved: "This entity is cleared for partnerships.",
  pending: "Awaiting university review.",
  "not-approved": "Not cleared for partnerships at this time.",
};

function asDate(d?: string | Date | null): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

function daysUntil(date?: string | Date | null): number | null {
  const dt = asDate(date);
  if (!dt) return null;
  const now = new Date();
  const diffMs = dt.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function EntityStatus({
  status: rawStatus,
  entityName,
  requestedAt,
  approvedAt,
  expiryAt,
  loading,
  compact,
  className,
}: Props) {
  const status = (rawStatus || "").toString().toLowerCase();

  const tone = toneByStatus[status] ?? "bg-white border-border";
  const title = titleByStatus[status] ?? "Status";
  const blurb = blurbByStatus[status] ?? "";
  const [load, setLoad] = useState(true);
  const expiryDays = useMemo(() => daysUntil(expiryAt), [expiryAt]);
  const isExpiringSoon = typeof expiryDays === "number" && expiryDays <= 60 && expiryDays >= 0;

  useEffect(() => {
    if (!loading) setLoad(false);
  }, [loading]);

  if (load || !status) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-6">
        Loading account status...
      </div>
    );
  }

  return (
    status?.trim() && (
      <CustomCard className={`border ${tone} "p-4" ${className ?? ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Current Account Status</Badge>
            </div>

            <div className="text-foreground mt-1 text-base font-semibold tracking-tight">
              {title}
            </div>

            {!compact && <p className="text-muted-foreground text-sm">{blurb}</p>}

            <div className="text-muted-foreground mt-1 space-y-1 text-xs">
              {status === "approved" && (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Effective {approvedAt ? <b>{formatWhen(approvedAt)}</b> : <i>—</i>} </span>
                </div>
              )}

              {status === "pending" && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>Requested {requestedAt ? <b>{formatWhen(requestedAt)}</b> : <i>—</i>}</span>
                </div>
              )}

              {status === "not-approved" && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Contact your MOA office for next steps.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CustomCard>
    )
  );
}
