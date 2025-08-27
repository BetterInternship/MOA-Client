// components/moa/dashboard/StatusBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // assuming you have cn utility
import type { MoaStatus } from "@/types/moa";

type Props = {
  status: MoaStatus | string;
  className?: string;
};

export default function StatusBadge({ status, className }: Props) {
  const base = (variant: string, label: string) => (
    <Badge type={variant as any} className={cn(className)}>
      {label}
    </Badge>
  );

  switch (status.toLowerCase()) {
    case "active":
      return base("supportive", "Active");
    case "inactive":
      return base("accent", "Inactive");
    case "approved":
      return base("supportive", "Approved");
    case "rejected":
      return base("destructive", "Rejected");
    case "needs info":
      return base("primary", "Needs Info");
    case "under review":
      return base("warning", "Under Review");
    case "sign-approved":
      return base("warning", "Needs Signing");
    case "pending":
    default:
      return base("warning", "Pending");
  }
}
