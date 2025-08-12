// components/univ/dashboard/cards/MoaDetailsCard.tsx
"use client";

import { Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { MoaStatus } from "@/types/moa-request";

type Props = {
  companyId: string;
  status: MoaStatus;
  validUntil?: string;
  loading?: boolean;
};

export default function MoaDetailsCard({ companyId, status, validUntil, loading }: Props) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">MOA Details</h2>
        <a
          href={`/docs/${companyId}/moa.pdf`}
          download
          className="border-primary bg-primary hover:bg-primary/90 inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Preparing..." : "Download MOA"}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-sm">MOA Status</div>
          <div className="mt-1">
            <StatusBadge status={status} />
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Valid Until</div>
          <div className="mt-1 font-medium">{validUntil ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}
