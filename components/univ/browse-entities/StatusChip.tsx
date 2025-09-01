// components/univ/dashboard/StatusChip.tsx
"use client";

import { cn } from "@/lib/utils";

type StatusChipProps = {
  status?: string | null; // accept flexible inputs
  className?: string;
};

const normalize = (s?: string | null) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const titleize = (s: string) => s.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const CONFIG: Record<string, { label: string; classes: string }> = {
  // canonical keys
  pending: { label: "Pending", classes: "bg-amber-100 text-amber-800" },
  needs_info: { label: "Needs Info", classes: "bg-sky-100 text-sky-800" },
  under_review: { label: "Under Review", classes: "bg-indigo-100 text-indigo-800" },
  approved: { label: "Approved", classes: "bg-emerald-100 text-emerald-700" },
  denied: { label: "Denied", classes: "bg-rose-100 text-rose-700" },

  // extra variants you might get from backend
  conversing: { label: "Needs Info", classes: "bg-sky-100 text-sky-800" },
  registered: { label: "Registered", classes: "bg-slate-100 text-slate-700" },
  blacklisted: { label: "Blacklisted", classes: "bg-rose-100 text-rose-700" },
};

export default function StatusChip({ status, className }: StatusChipProps) {
  const key = normalize(status);
  const cfg = CONFIG[key];

  // default/fallback
  const classes = cfg?.classes ?? "bg-gray-100 text-gray-800";
  const label = cfg?.label ?? (status?.trim() ? titleize(normalize(status)) : "—");

  return (
    <span
      aria-label={`Status: ${label}`}
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        classes,
        className
      )}
    >
      {label}
    </span>
  );
}
