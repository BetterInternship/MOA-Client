"use client";

import { cn } from "@/lib/utils";
import { RequestStatus } from "@/types/company-request";

export default function StatusChip({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, string> = {
    Pending: "bg-amber-100 text-amber-800",
    "Needs Info": "bg-sky-100 text-sky-800",
    Approved: "bg-emerald-100 text-emerald-700",
    Denied: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", map[status])}>{status}</span>
  );
}
