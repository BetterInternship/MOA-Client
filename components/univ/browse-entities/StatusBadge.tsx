"use client";

type AnyStatus = string | null | undefined;

const toKey = (s: AnyStatus) => {
  const raw = (s ?? "").toString().trim().toLowerCase();
  return raw;
};

import { Company } from "@/types/company";

export default function StatusBadge({ status }: { status: Company["moaStatus"] }) {
  const key = toKey(status);

  const map: Record<string, string> = {
    registered: "bg-amber-100 text-amber-800", // Pending-like
    approved: "bg-emerald-100 text-emerald-700", // Success
    blacklisted: "bg-rose-100 text-rose-700", // Danger
  };

  const cls = map[key] ?? "bg-gray-100 text-gray-700";
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : "—";

  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}
