"use client";

import { FilePlus, ClipboardList, HelpCircle } from "lucide-react";
import KpiGrid, { type Kpi } from "@/components/dashboard/KpiGrid";
import RecentActivity, { type RecentItem } from "@/components/dashboard/RecentActivity";
import ActionGrid, { type ActionItem } from "@/components/dashboard/ActionGrid";

export default function DashboardPage() {
  // KPIs — replace with API values
  const kpis: Kpi[] = [
    { label: "Total MOA Requests", value: 3, hint: "Includes Standard & Negotiated MOAs" },
    { label: "Pending Actions", value: 1, hint: "Items awaiting your input" },
  ];

  // Recent Activity — replace with API values
  const recent: RecentItem[] = [
    { id: "REQ-2025-014", type: "Standard", status: "Under Review", date: "Aug 7, 2025" },
    { id: "REQ-2025-013", type: "Negotiated", status: "Awaiting Signature", date: "Aug 5, 2025" },
  ];

  const actions: ActionItem[] = [
    {
      label: "Draft MOA",
      href: "/dashboard/request",
      icon: FilePlus,
      desc: "Create a new MOA. Choose Standard or Negotiated in the next step.",
      cta: "Start drafting",
    },
    {
      label: "MOA Status",
      href: "/dashboard/status",
      icon: ClipboardList,
      desc: "Track progress, signatories, and timelines for your requests.",
      cta: "View status",
    },
    {
      label: "Support",
      href: "/support",
      icon: HelpCircle,
      desc: "Get help from legal support or browse the help center.",
      cta: "Get help",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-semibold">Home</h1>
        <p className="text-muted-foreground text-sm">
          Quick stats and actions for managing your MOAs.
        </p>
      </div>

      {/* KPIs + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <KpiGrid kpis={kpis} />
        <RecentActivity items={recent} />
      </div>

      {/* Primary actions */}
      <section aria-label="Primary actions" className="space-y-4">
        <h2 className="text-foreground text-2xl font-semibold">Actions</h2>
        <ActionGrid actions={actions} />
      </section>
    </div>
  );
}
