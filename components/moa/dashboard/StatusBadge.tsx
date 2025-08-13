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

  switch (status) {
    case "Active":
      return base("success", "Active");
    case "Inactive":
      return base("outline", "Inactive");
    case "Approved":
      return base("success", "Approved");
    case "Rejected":
      return base("destructive", "Rejected");
    case "Needs Info":
      return base("outline", "Needs Info");
    case "Under Review":
      return base("secondary", "Under Review");
    case "Pending":
    default:
      return base("default", "Pending");
  }
}
