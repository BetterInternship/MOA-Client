// hooks/useCompanyDetail.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Entity, Message, URLString, ISODate } from "@/types/db";
import type {
  MoaRequest as UiMoaRequest,
  MoaHistoryItem,
  MoaHistoryFile,
  MoaStatus,
} from "@/types/moa-request";
import { useSchoolPartner } from "@/app/api/school.api";

/* ── helpers ─────────────────────────────────────────────────────────────── */

const firstNonEmpty = (...vals: (string | undefined | null)[]) =>
  vals.find((v) => v !== undefined && v !== null && String(v).trim() !== "") ?? "";

const toMDY = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// map backend/raw status -> UI badge text (nullable while loading)
type BackendMoa =
  | "approved"
  | "denied"
  | "under_review"
  | "pending"
  | "blacklisted"
  | "registered"
  | string
  | null
  | undefined;

const toMoaStatus = (s?: BackendMoa): MoaStatus | null => {
  switch ((s ?? "").toString().toLowerCase()) {
    case "approved":
      return "Approved";
    case "denied":
    case "blacklisted":
      return "Denied";
    case "registered":
      return "Registered";
    default:
      return null; // unknown yet → let UI show a skeleton/placeholder
  }
};

const fileToHistoryFile = (url: URLString, stamp: ISODate): MoaHistoryFile => {
  const name = url.split("/").pop() || "file";
  return { id: `${stamp}-${name}`, name, url };
};

/* ── history API (response shape) ────────────────────────────────────────── */

type HistoryApiFile = { id: string; name: string; url: string };
type HistoryApiItem = { timestamp: ISODate; text: string; files?: HistoryApiFile[] };
type HistoryApiResponse =
  | { success: true; history: HistoryApiItem[] }
  | { success: true; data: { history: HistoryApiItem[] } }
  | any;

/* ── hook ────────────────────────────────────────────────────────────────── */

export function useCompanyDetail(company?: Entity) {
  const companyId = company?.id ?? "";

  /* A) partner details (entity + status from school_entities) */
  const { partner, isLoading: partnerLoading } = useSchoolPartner(companyId);

  /* B) history fetch */
  const [history, setHistory] = useState<MoaHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setHistory([]);
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        setHistoryLoading(true);
        const base = process.env.NEXT_PUBLIC_CLIENT_URL || "";
        const res = await fetch(`${base}/api/school/entities/${companyId}/history`, {
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setHistory([]); // keep empty if 404/401/etc.
          return;
        }
        const json: HistoryApiResponse = await res.json();
        const list: HistoryApiItem[] = json?.data?.history ?? json?.history ?? [];

        const items: MoaHistoryItem[] = list
          .map((it) => ({
            date: toMDY(it.timestamp),
            text: it.text,
            files: (it.files ?? []).map((f) => ({
              id: f.id,
              name: f.name,
              url: f.url,
            })) as MoaHistoryFile[],
          }))
          .sort((a, b) => +new Date(b.date) - +new Date(a.date));

        setHistory(items);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          // console.error(e);
        }
      } finally {
        setHistoryLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [companyId]);

  const loading = partnerLoading || historyLoading;

  /* C) view model (top cards) */

  const backendStatusRaw: BackendMoa = (partner as any)?.moaStatus ?? (company as any)?.moaStatus;

  const moaStatus: MoaStatus | null = toMoaStatus(backendStatusRaw);

  const name = firstNonEmpty(
    (company as any)?.display_name,
    (partner as any)?.display_name,
    company?.legal_identifier
  );

  const contactPerson = firstNonEmpty(company?.contact_name, (partner as any)?.contact_name);

  const email = firstNonEmpty(company?.contact_email, (partner as any)?.contact_email);

  const phone = firstNonEmpty((company as any)?.contact_phone, (partner as any)?.contact_phone);

  const view = useMemo(() => {
    if (!companyId) return null;
    return {
      id: companyId,
      name,
      contactPerson,
      email,
      phone,
      moaStatus, // <- pass this to MoaDetailsCard.status
      validUntil: undefined as string | undefined,
    };
  }, [companyId, name, contactPerson, email, phone, moaStatus]);

  /* D) request/history view model for CompanyRequestHistory */

  const reqData: UiMoaRequest | null = useMemo(() => {
    if (!companyId) return null;

    // earliest date across history items; if none, use "today"
    const allDates = history.map((h) => h.date);
    const earliestIso =
      allDates.length > 0
        ? new Date(Math.min(...allDates.map((d) => +new Date(d)))).toISOString()
        : new Date().toISOString();

    return {
      id: companyId,
      companyName: name ?? "",
      contactPerson: contactPerson ?? "",
      email: email ?? "",
      tin: "",
      industry: "",
      requestedAt: toMDY(earliestIso),
      status: (moaStatus ?? "Under Review") as MoaStatus,
      notes: undefined,
      history,
    };
  }, [companyId, name, contactPerson, email, moaStatus, history]);

  // You don't use `detail` in the component; keep it for API compatibility.
  return { loading, detail: null, view, reqData };
}
