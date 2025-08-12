"use client";

import { Company } from "@/types/company";

export default function StatusBadge({ status }: { status: Company["moaStatus"] }) {
  const map: Record<Company["moaStatus"], string> = {
    registered: "bg-amber-100 text-amber-800", // Pending-like
    approved: "bg-emerald-100 text-emerald-700", // Success
    blacklisted: "bg-rose-100 text-rose-700", // Danger
  };

  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
    </span>
  );
}
