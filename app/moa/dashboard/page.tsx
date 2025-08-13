// app/moa/(dashboard)/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MoaActions from "@/components/moa/dashboard/MoaActions";
import MoaStatus from "@/components/moa/dashboard/MoaStatus";
import CompanyRequestHistory from "@/components/univ/shared/CompanyRequestHistory";
import type { MoaItem } from "@/types/moa";

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<MoaItem[]>([]);
  const [loading, setLoading] = useState(false);

  // One-company dashboard: include exactly one MOA entry (plus you can keep other requests if needed).
  const fallback: MoaItem[] = useMemo(
    () => [
      {
        id: "moa_2025_main",
        request: "MOA with DLSU (AY 2025–2026)",
        type: "Standard MOA",
        submittedAt: "Aug 7, 2025",
        status: "Active", // <- single source of truth for the one-card display
      },
      // (Optional) Non‑MOA requests can remain in the list; they will be ignored by MoaStatus:
      // {
      //   id: "req_vendor_001",
      //   request: "Company Approval – New Vendor Onboarding",
      //   type: "Company Approval",
      //   submittedAt: "Jul 30, 2025",
      //   status: "Pending",
      // },
    ],
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/moa/requests", { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items?: MoaItem[] };
        const list = data?.items ?? [];
        setItems(list.length ? list : fallback);
      } catch (e) {
        console.error(e);
        setItems(fallback);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [fallback]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-semibold">Home</h1>
        <p className="text-muted-foreground text-sm">
          Start a new MOA or track the status of your requests.
        </p>
      </div>

      {/* One-card MOA status */}
      <MoaStatus title="MOA Status" items={items} loading={loading} />

      {/* Actions (only Standard / Negotiated) */}
      <MoaActions
        onStandard={() => router.push("/dashboard/request/standard")}
        onNegotiated={() => router.push("/dashboard/request/negotiated")}
      />

      {/* MOA Log */}
      <div className="space-y-4">
        <h2 className="text-foreground text-2xl font-semibold">Company Log</h2>
        <CompanyRequestHistory showTitle={false} />
      </div>

      
    </div>
  );
}
