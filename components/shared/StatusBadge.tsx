"use client";

import { Company } from "@/types/company";

export default function StatusBadge({ status }: { status: Company["moaStatus"] }) {
  const map: Record<Company["moaStatus"], string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Expired: "bg-rose-100 text-rose-700",
    "Under Review": "bg-amber-100 text-amber-800",
  };
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>;
}
