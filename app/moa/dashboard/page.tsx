"use client";

import { useEffect, useState } from "react";
import { FilePlus, ClipboardList, HelpCircle } from "lucide-react";
import KpiGrid, { type Kpi } from "@/components/moa/dashboard/KpiGrid";
import RecentActivity, { type RecentItem } from "@/components/moa/dashboard/RecentActivity";
import ActionGrid, { type ActionItem } from "@/components/moa/dashboard/ActionGrid";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        // For mock/demo: the API defaults to the first mock entity account.
        // If you want a specific entity, append: ?entityId=<uuid>
        const res = await fetch(`/api/moa/dashboard`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setKpis(data.kpis ?? []);
        setRecent(data.recent ?? []);
      } catch (err) {
        if ((err as any).name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

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
      href: "/dashboard/support",
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
        <KpiGrid
          kpis={
            kpis.length
              ? kpis
              : [
                  { label: "Total MOA Requests", value: loading ? "…" : 0 },
                  { label: "Pending Actions", value: loading ? "…" : 0 },
                ]
          }
        />
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
