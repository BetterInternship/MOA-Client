// app/moa/(dashboard)/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MoaActions from "@/components/moa/dashboard/MoaActions";
import MoaStatus from "@/components/moa/dashboard/MoaStatus";
import CompanyRequestHistory from "@/components/univ/shared/CompanyRequestHistory";
import type { MoaItem } from "@/types/moa";
import type { MoaRequest } from "@/types/moa-request";
import { DemoRT } from "@/lib/demo-realtime";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<MoaItem[]>([]);
  const [requestLog, setRequestLog] = useState<MoaRequest | null>(null);
  const [loading, setLoading] = useState(false);

  // One-company fallback (only if API fails)
  const fallback: MoaItem[] = useMemo(
    () => [
      {
        id: "moa_2025_main",
        request: "MOA with DLSU (AY 2025–2026)",
        type: "Standard MOA",
        submittedAt: "Aug 7, 2025",
        status: "Active",
      },
    ],
    []
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        const res = await fetch("/api/moa/requests", { signal, cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items?: MoaItem[]; req?: MoaRequest };
        const list = data?.items ?? [];
        setItems(list);
        setRequestLog(data?.req ?? null);
      } catch (e) {
        console.error(e);
        setItems(fallback); // graceful fallback
        setRequestLog(null);
      } finally {
        setLoading(false);
      }
    },
    [fallback]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);

    // cross-tab/page realtime updates
    DemoRT.onStage(() => load());
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      ctrl.abort();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  const hasMoa = (items ?? []).some((i) => (i.type || "").toLowerCase().includes("moa"));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-semibold">Home</h1>
        <p className="text-muted-foreground text-sm">
          Start a new MOA or track the status of your requests.
        </p>
      </div>

      {/* One-card MOA status (already handles loading / empty) */}
      <MoaStatus title="MOA Status" items={items} loading={loading} />

      {/* Actions (only Standard / Negotiated) */}
      <MoaActions
        onStandard={() => router.push("/moa/dashboard/request/standard")}
        onNegotiated={() => router.push("/moa/dashboard/request/negotiated")}
      />

      {/* MOA Log */}
      <div className="space-y-4">
        <h2 className="text-foreground text-2xl font-semibold">Company Log</h2>
        {/* Pass the API-provided request log. If stage 0, it's an empty history and the component shows "No history yet." */}
        <CompanyRequestHistory showTitle={false} req={requestLog ?? undefined} />
      </div>
    </div>
  );
}
