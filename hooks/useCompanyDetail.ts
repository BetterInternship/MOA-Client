// hooks/useCompanyDetail.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Entity,
  EntityLog,
  PrivateNote,
  NewEntityRequest,
  MoaRequest as DbMoaRequest,
  Message,
  SchoolEntity,
  URLString,
  ISODate,
} from "@/types/db";
import type {
  MoaRequest as UiMoaRequest,
  MoaHistoryItem,
  MoaHistoryFile,
  MoaStatus,
} from "@/types/moa-request";

export type CompanyRow = {
  id: string;
  name: string;
  legalName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: "registered" | "approved" | "blacklisted" | null;
  lastActivity: string | null;
  noteCount: number;
  documents: { documentType: string; url: string }[];
};

type ApiDetail = {
  entity: Entity;
  schoolEntity?: SchoolEntity;
  logs: EntityLog[];
  notes: PrivateNote[];
  requests: { newEntity: NewEntityRequest[]; moa: DbMoaRequest[] };
  messages?: Message[];
};

const firstNonEmpty = (...vals: (string | undefined | null)[]) =>
  vals.find((v) => v !== undefined && v !== null && String(v).trim() !== "") ?? "";

const toMDY = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const toMoaStatus = (s?: SchoolEntity["status"] | null): MoaStatus => {
  switch (s) {
    case "approved":
      return "Approved";
    case "blacklisted":
      return "Denied";
    case "registered":
    case null:
    case undefined:
    default:
      return "Under Review";
  }
};

const fileToHistoryFile = (url: URLString, stamp: ISODate): MoaHistoryFile => {
  const name = url.split("/").pop() || "file";
  return { id: `${stamp}-${name}`, name, url };
};

export function useCompanyDetail(company: CompanyRow | undefined) {
  const [detail, setDetail] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch
  useEffect(() => {
    if (!company?.id) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/univ/companies/${company.id}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ApiDetail = await res.json();
        setDetail(data);
      } catch (e: any) {
        if (e?.name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [company?.id]);

  // View model (top cards)
  const view = useMemo(() => {
    const d = detail;
    if (!company) return null;

    const name = firstNonEmpty(company.name, d?.entity.displayName);
    const contactPerson = firstNonEmpty(company.contactName, d?.entity.contactName);
    const email = firstNonEmpty(company.contactEmail, d?.entity.contactEmail);
    const phone = firstNonEmpty(company.contactPhone, d?.entity.contactPhone);

    const documents = company.documents?.length
      ? company.documents.map((doc) => ({ label: doc.documentType, href: doc.url }))
      : (d?.entity.entityDocuments ?? []).map((doc) => ({
          label: doc.documentType,
          href: doc.url,
        }));

    const badgeStatus = toMoaStatus(d?.schoolEntity?.status);

    return {
      id: company.id,
      name,
      contactPerson,
      email,
      phone,
      documents,
      badgeStatus,
      validUntil: undefined as string | undefined,
    };
  }, [company, detail]);

  // History + UiMoaRequest
  const reqData: UiMoaRequest | null = useMemo(() => {
    if (!company) return null;
    const d = detail;

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

    const messageItems: MoaHistoryItem[] = (d?.messages ?? []).map((m) => {
      const label = m.action === "approve" ? "Approved" : m.action === "deny" ? "Denied" : "Reply";
      const files: MoaHistoryFile[] | undefined = (m.attachments ?? []).length
        ? (m.attachments ?? []).map((u, idx) => {
            const name = u.split("/").pop() || `attachment-${idx + 1}`;
            return { id: `${m.timestamp}-${name}`, name, url: u };
          })
        : undefined;
      const extra = m.comments ? ` — ${m.comments}` : "";
      return { date: toMDY(m.timestamp), text: `${label}${extra}`, files };
    });

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

    const merged = [...logItems, ...noteItems, ...messageItems, ...requestItems].sort(
      (a, b) => +new Date(b.date) - +new Date(a.date)
    );

    return {
      id: company.id,
      companyName: view?.name ?? "",
      contactPerson: view?.contactPerson ?? "",
      email: view?.email ?? "",
      tin: "", // wire later if present in DB
      industry: "",
      requestedAt: toMDY(earliestIso),
      status: toMoaStatus(d?.schoolEntity?.status),
      notes: undefined,
      history: merged,
    };
  }, [company, detail, view]);

  return { loading, detail, view, reqData };
}
