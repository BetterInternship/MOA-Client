"use client";

import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types/company-request";

export default function StatusChip({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  const colorMap: Record<RequestStatus, string> = {
    Pending: "bg-amber-100 text-amber-800",
    "Needs Info": "bg-sky-100 text-sky-800",
    "Under Review": "bg-indigo-100 text-indigo-800",
    Approved: "bg-emerald-100 text-emerald-700",
    Denied: "bg-rose-100 text-rose-700",
  };

  const fallback = "bg-gray-100 text-gray-800";
  const color = colorMap[status] ?? fallback;

  return (
    <span
      aria-label={`Status: ${status}`}
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        color,
        className
      )}
    >
      {status}
    </span>
  );
}
