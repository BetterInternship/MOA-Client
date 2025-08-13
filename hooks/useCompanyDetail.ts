// hooks/useCompanyDetail.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { MoaRequest } from "@/types/moa-request";

type View = {
  id: string;
  badgeStatus: MoaRequest["status"];
  validUntil?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  documents: { label: string; href: string }[];
};

export function useCompanyDetail(company: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [reqData, setReqData] = useState<MoaRequest | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/univ/companies/${company.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const js = await res.json();

        const badgeStatus = js?.moa?.status ?? "Inactive";
        const v: View = {
          id: js?.entity?.id,
          badgeStatus,
          validUntil: js?.moa?.validUntil,
          name: js?.entity?.displayName,
          contactPerson: js?.entity?.contactName,
          email: js?.entity?.contactEmail,
          phone: js?.entity?.contactPhone,
          documents: Array.isArray(js?.entity?.entityDocuments)
            ? js.entity.entityDocuments.map((d: any, i: number) => ({
                label: d.documentType || `Document ${i + 1}`,
                href: d.url || "#",
              }))
            : [],
        };

        const req: MoaRequest = {
          id: js?.request?.id ?? "moa_2025_main",
          companyName: js?.entity?.displayName ?? "—",
          contactPerson: js?.entity?.contactName ?? "—",
          email: js?.entity?.contactEmail ?? "—",
          tin: js?.request?.tin ?? "—",
          industry: js?.request?.industry ?? "—",
          requestedAt: js?.request?.requestedAt ?? "—",
          status: js?.request?.status ?? "Pending",
          notes: js?.request?.notes ?? "",
          history: Array.isArray(js?.request?.history) ? js.request.history : [],
        };

        if (alive) {
          setView(v);
          setReqData(req);
        }
      } catch (e) {
        console.error("useCompanyDetail error:", e);
        if (alive) {
          setView(null);
          setReqData(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [company.id]);

  return { loading, view, reqData };
}
