// hooks/useCompanyRequests.ts
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { preconfiguredAxios } from "@/app/api/preconfig.axios";
import type { CompanyRequest } from "@/types/company-request";

/* ---------- backend row shape (what your controller returns) ---------- */
type RawCompanyRequest = {
  id: string;
  entity_id: string;
  timestamp?: string;
  thread_id?: string | null;
  processed_by_account_id?: string | null;
  processed_date?: string | null;
  outcome?: "approved" | "denied" | "pending" | "conversing" | null;
  school_id: string;
  entities?: {
    id: string;
    type?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    display_name?: string | null;
    legal_identifier?: string | null;
  };
};

const toMDY = (d?: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(+dt)) return "—";
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

/* ---------- mapper: backend → UI (CompanyRequest) ---------- */
// ! remove this eventually, i dont think we need a mapper
const mapRequestRow = (r: RawCompanyRequest): CompanyRequest => {
  const e = r.entities ?? {};
  const companyName =
    (e.display_name && e.display_name.trim()) ||
    (e.legal_identifier && e.legal_identifier.trim()) ||
    r.entity_id;

  return {
    // ids
    id: r.id,
    entity_id: r.entity_id,

    // fields used by your components
    companyName,
    contactPerson: e.contact_name ?? "",
    email: e.contact_email ?? "",
    submittedAt: toMDY(r.timestamp),
    status: (r.outcome ?? "pending") as CompanyRequest["status"],
    reason: "",

    // optionally keep some raw/meta if you need later
    processedBy: r.processed_by_account_id ?? undefined,
    processedAt: toMDY(r.processed_date ?? undefined),
    entity: {
      id: e.id ?? r.entity_id,
      display_name: e.display_name ?? undefined,
      legal_identifier: e.legal_identifier ?? undefined,
      contact_name: e.contact_name ?? undefined,
      contact_email: e.contact_email ?? undefined,
      type: e.type ?? undefined,
    },
  };
};

/* ------------------------- LIST hook ------------------------- */
// ! move this to school or something, god we really gotta refactor this somehow
export function useCompanyRequests(opts?: { offset?: number; limit?: number }) {
  const { offset = 0, limit = 50 } = opts ?? {};
  return useQuery({
    queryKey: ["new-entity-requests", { offset, limit }],
    queryFn: async () => {
      const res = await preconfiguredAxios.get<{ requests: RawCompanyRequest[] }>(
        "/api/schools/company-requests",
        { params: { offset, limit } }
      );
      return (res?.requests ?? (res as any)?.data?.requests ?? []) as RawCompanyRequest[];
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

/* ------------------------- SINGLE hook ------------------------- */
export function useCompanyRequest(entityId?: string) {
  return useQuery({
    enabled: !!entityId,
    queryKey: ["schools", "company-request", entityId],
    queryFn: async () => {
      const res = await preconfiguredAxios.get<{ requests: RawCompanyRequest[] }>(
        `/api/schools/company-requests/${entityId}`
      );
      const row = (res?.requests ?? (res as any)?.data?.requests ?? [])[0] as
        | RawCompanyRequest
        | undefined;
      return row ? mapRequestRow(row) : null;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}
