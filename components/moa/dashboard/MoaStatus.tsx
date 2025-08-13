// components/moa/dashboard/MoaStatus.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";
import type { MoaItem, MoaStatus } from "@/types/moa";

type Props = {
  items: MoaItem[];
  loading?: boolean;
  title?: string;
};

const statusColors: Record<MoaStatus, string> = {
  Active: "bg-emerald-50 border-emerald-200",
  Inactive: "bg-gray-50 border-gray-200",
  Approved: "bg-emerald-50 border-emerald-200",
  Rejected: "bg-rose-50 border-rose-200",
  "Needs Info": "bg-yellow-50 border-yellow-200",
  "Under Review": "bg-blue-50 border-blue-200",
  Pending: "bg-muted border-muted",
};

export default function MoaStatus({ items, loading, title = "MOA Status" }: Props) {
  const moa = (items ?? [])
    .filter((i) => (i.type || "").toLowerCase().includes("moa"))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

  return (
    <section aria-label={title} className="space-y-4">
      <h2 className="text-foreground text-2xl font-semibold">{title}</h2>

      {loading ? (
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Loading…
        </div>
      ) : !moa ? (
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          No MOA requests yet.
        </div>
      ) : (
        <Card className={cn(statusColors[moa.status as MoaStatus] || "bg-white")}>
          <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-xl font-semibold">{moa.type}</span>
              <div className="text-muted-foreground flex gap-1">
                Valid until
                <span className="font-semibold">{moa.submittedAt}</span>
              </div>
            </div>
            <StatusBadge status={moa.status} className="text-base font-semibold uppercase" />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
