// hooks/useCompanyDetail.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Entity,
  EntityLog,
  PrivateNote,
  NewEntityRequest,
  Message,
  URLString,
  ISODate,
} from "@/types/db";
import type {
  MoaRequest as UiMoaRequest,
  MoaHistoryItem,
  MoaHistoryFile,
  MoaStatus,
} from "@/types/moa-request";
import { useSchoolPartner } from "@/app/api/entity.api";

/* helpers */

const firstNonEmpty = (...vals: (string | undefined | null)[]) =>
  vals.find((v) => v !== undefined && v !== null && String(v).trim() !== "") ?? "";

const toMDY = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// map backend/raw status -> UI badge text
type BackendMoa =
  | "approved"
  | "denied"
  | "under_review"
  | "pending"
  | "blacklisted"
  | string
  | null
  | undefined;
const toMoaStatus = (s?: BackendMoa): MoaStatus => {
  switch ((s ?? "").toString().toLowerCase()) {
    case "approved":
      return "Approved";
    case "denied":
    case "registered":
      return "Registered";
    case "blacklisted":
      return "Denied";
    default:
      return null;
  }
};

const fileToHistoryFile = (url: URLString, stamp: ISODate): MoaHistoryFile => {
  const name = url.split("/").pop() || "file";
  return { id: `${stamp}-${name}`, name, url };
};

/* optional Next aggregator payload (logs/notes/requests) */

type ApiDetail = {
  entity: Entity;
  schoolEntity?: { status?: string | null } | null;
  logs: EntityLog[];
  notes: PrivateNote[];
  requests: { newEntity: NewEntityRequest[]; moa: { timestamp: ISODate; schoolID: string }[] };
  messages?: Message[];
};

/* hook */

export function useCompanyDetail(company?: Entity) {
  const companyId = company?.id ?? "";

  // A) primary: backend partner (merged entity + status from school_entities)
  const { partner, isLoading: partnerLoading } = useSchoolPartner(companyId);

  // B) optional: local Next aggregator for history; ignore if 404
  const [extra, setExtra] = useState<ApiDetail | null>(null);
  const [extraLoading, setExtraLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setExtra(null);
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        setExtraLoading(true);
        const res = await fetch(`/api/univ/companies/${companyId}`, { signal: ctrl.signal });
        if (!res.ok) return; // silently ignore (404, 401, etc.)
        const data: ApiDetail = await res.json();
        setExtra(data);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          // console.error(e);
        }
      } finally {
        setExtraLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [companyId]);

  const loading = partnerLoading || extraLoading;

  /* view model (top cards) */

  const backendStatusRaw: BackendMoa =
    (partner as any)?.moaStatus ?? (extra?.schoolEntity?.status as BackendMoa);

  const moaStatus: MoaStatus = toMoaStatus(backendStatusRaw);

  const name = firstNonEmpty(
    (company as any)?.display_name,
    (partner as any)?.display_name,
    extra?.entity?.display_name,
    company?.legal_identifier
  );

  const contactPerson = firstNonEmpty(
    company?.contact_name,
    (partner as any)?.contact_name,
    extra?.entity?.contact_name
  );

  const email = firstNonEmpty(
    company?.contact_email,
    (partner as any)?.contact_email,
    extra?.entity?.contact_email
  );

  const phone = firstNonEmpty(
    (company as any)?.contact_phone,
    (partner as any)?.contact_phone,
    extra?.entity?.contact_phone
  );

  const view = useMemo(() => {
    if (!companyId) return null;
    return {
      id: companyId,
      name,
      contactPerson,
      email,
      phone,
      moaStatus, // <-- use this in UI
      validUntil: undefined as string | undefined,
    };
  }, [companyId, name, contactPerson, email, phone, moaStatus]);

  /* history / request view model */

  const reqData: UiMoaRequest | null = useMemo(() => {
    if (!companyId) return null;
    const d = extra;

    const allReqTimes: ISODate[] = [
      ...(d?.requests?.newEntity ?? []).map((r) => r.timestamp),
      ...(d?.requests?.moa ?? []).map((r) => r.timestamp),
    ];
    const earliestIso =
      allReqTimes.length > 0
        ? new Date(Math.min(...allReqTimes.map((t) => +new Date(t)))).toISOString()
        : new Date().toISOString();

    const logItems: MoaHistoryItem[] =
      d?.logs.map((l) => {
        const files = l.file ? [fileToHistoryFile(l.file, l.timestamp)] : undefined;
        const text =
          l.update === "note" ? "Note added" : l.update.charAt(0).toUpperCase() + l.update.slice(1);
        return { date: toMDY(l.timestamp), text, files };
      }) ?? [];

    const noteItems: MoaHistoryItem[] =
      d?.notes.map((n) => ({
        date: toMDY(n.timestamp),
        text: `Private note by ${n.authorId}: ${n.message}`,
      })) ?? [];

    const messageItems: MoaHistoryItem[] =
      (d?.messages ?? []).map((m) => {
        const label =
          m.action === "approve" ? "Approved" : m.action === "deny" ? "Denied" : "Reply";
        const files: MoaHistoryFile[] | undefined = (m.attachments ?? []).length
          ? (m.attachments ?? []).map((u, idx) => {
              const name = u.split("/").pop() || `attachment-${idx + 1}`;
              return { id: `${m.timestamp}-${name}`, name, url: u };
            })
          : undefined;
        const extra = m.comments ? ` — ${m.comments}` : "";
        return { date: toMDY(m.timestamp), text: `${label}${extra}`, files };
      }) ?? [];

    const requestItems: MoaHistoryItem[] = [
      ...(d?.requests?.newEntity ?? []).map((r) => ({
        date: toMDY(r.timestamp),
        text: "Submitted new company registration request",
      })),
      ...(d?.requests?.moa ?? []).map((r) => ({
        date: toMDY(r.timestamp),
        text: `Submitted MOA request (School ID: ${r.schoolID})`,
      })),
    ];

    const history = [...logItems, ...noteItems, ...messageItems, ...requestItems].sort(
      (a, b) => +new Date(b.date) - +new Date(a.date)
    );

    return {
      id: companyId,
      companyName: name ?? "",
      contactPerson: contactPerson ?? "",
      email: email ?? "",
      tin: "",
      industry: "",
      requestedAt: toMDY(earliestIso),
      status: moaStatus,
      notes: undefined,
      history,
    };
  }, [companyId, extra, name, contactPerson, email, moaStatus]);

  return { loading, detail: extra, view, reqData };
}
