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
    <Badge variant={variant as any} className={cn(className)}>
      {label}
    </Badge>
  );

  switch (status.toLowerCase()) {
    case "active":
      return base("success", "Active");
    case "inactive":
      return base("outline", "Inactive");
    case "approved":
      return base("success", "Approved");
    case "rejected":
      return base("destructive", "Rejected");
    case "needs info":
      return base("outline", "Needs Info");
    case "under review":
      return base("secondary", "Under Review");
    case "pending":
    default:
      return base("default", "Pending");
  }
}
