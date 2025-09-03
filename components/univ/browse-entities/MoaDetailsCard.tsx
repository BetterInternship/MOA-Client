// components/univ/dashboard/cards/MoaDetailsCard.tsx
"use client";

import { Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { MoaStatus } from "@/types/moa-request";
import { cn } from "@/lib/utils";

type Props = {
  companyId: string;
  companyName: string;
  status: MoaStatus;
  validUntil?: string;
  loading?: boolean;
  latestMoaUrl?: string;
};

export default function MoaDetailsCard({
  companyId,
  companyName,
  status,
  validUntil,
  loading,
  latestMoaUrl,
}: Props) {
  const canDownload = !!latestMoaUrl && !loading;
  const moaStatus =
    status === "approved" ? "Active"
      : status === "registered" ? "Inactive"
      : status === "blacklisted" ? "Blacklisted"
      : undefined;

  return (
    <div className="rounded-[0.33em] border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{companyName}</h2>

        <a
          href={canDownload ? (latestMoaUrl as string) : "#"}
          target="_blank"
          rel="noopener noreferrer"
          download
          className={cn(
            "border-primary bg-primary hover:bg-primary/90 inline-flex items-center rounded-[0.33em] border px-3 py-2 text-sm font-medium text-white",
            canDownload ? "" : "pointer-events-none opacity-60"
          )}
          aria-disabled={!canDownload}
          title={canDownload ? "Download MOA" : loading ? "Preparing..." : "No MOA available"}
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Preparing..." : canDownload ? "Download MOA" : "No MOA"}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-sm">MOA Status</div>
          <div className="mt-1">
            {/* @ts-ignore */}
            <StatusBadge status={moaStatus} />
          </div>
        </div>

        {validUntil ? (
          <div>
            <div className="text-muted-foreground text-sm">Valid Until</div>
            <div className="mt-1">{validUntil}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
