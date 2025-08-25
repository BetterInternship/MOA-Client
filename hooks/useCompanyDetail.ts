// hooks/useCompanyDetail.ts
"use client";

import { useMemo } from "react";
import type { Entity, URLString, ISODate } from "@/types/db";
import type {
  MoaRequest as UiMoaRequest,
  MoaHistoryItem,
  MoaHistoryFile,
} from "@/types/moa-request";
import { useSchoolPartner, useSchoolMoaHistory } from "@/app/api/school.api";

/* ---------------- helpers ---------------- */

const firstNonEmpty = (...vals: (string | undefined | null)[]) =>
  vals.find((v) => v !== undefined && v !== null && String(v).trim() !== "") ?? "";

const toMDY = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// backend → status *key* we can style on (lowercase)
type BackendMoa = string | null | undefined;
const toStatusKey = (s?: BackendMoa) => (s ?? "").toString().trim().toLowerCase();

// status label for human display
const toStatusLabel = (key: string): string => {
  switch (key) {
    case "approved":
      return "Approved";
    case "registered":
    case "pending":
      return "Registered";
    case "blacklisted":
    case "denied":
    case "rejected":
      return "Blacklisted";
    default:
      return "Under Review";
  }
};

const fileToHistoryFile = (url: URLString, stamp: ISODate): MoaHistoryFile => {
  const name = url.split("/").pop() || "file";
  return { id: `${stamp}-${name}`, name, url };
};

// Parses history that may arrive as:
// - an array of objects
// - a JSON string with single quotes: "[{'effective_date':'..','documents':'url1,url2'}]"
// - a JSON string with normal double quotes
const parseHistoryArray = (raw: unknown): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];

  if (typeof raw === "string") {
    let s = raw.trim();

    // strip one wrapping layer of quotes, if present
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1);
    }

    // convert single-quoted JSON into valid JSON
    const looksSingleQuoted = s.includes("':") || s.startsWith("[{'");
    const jsonish = looksSingleQuoted ? s.replace(/'/g, '"') : s;

    try {
      const parsed = JSON.parse(jsonish);
      return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    } catch {
      return [];
    }
  }

  // object → single-element array
  if (typeof raw === "object") return [raw as any];
  return [];
};

// Turn documents into an array of URLs. Supports:
// - comma/semicolon/whitespace-separated string
// - already an array
const explodeDocuments = (docs: unknown): URLString[] => {
  if (!docs) return [];
  if (Array.isArray(docs)) {
    return (docs as unknown[])
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean) as URLString[];
  }
  return String(docs)
    .split(/[,\s;]+/)
    .map((s) => s.trim())
    .filter(Boolean) as URLString[];
};

/** Normalize server history into { timestamp, text, files? }[] */
const normalizeHistoryItems = (
  raw: any
): Array<{ timestamp: ISODate; text: string; files?: URLString[] }> => {
  const arr = parseHistoryArray(raw);

  return arr
    .map((it: any) => {
      // Preferred shape
      if (it?.timestamp && it?.text) {
        const docs = explodeDocuments(it?.documents);
        const files = Array.isArray(it?.files) && it.files.length ? it.files : docs;
        return {
          timestamp: new Date(it.timestamp).toISOString(),
          text: String(it.text),
          files: files && files.length ? (files as URLString[]) : undefined,
        };
      }

      // Legacy master-sheet shape with effective/expiry + documents
      if (it?.effective_date || it?.expiry_date) {
        const docs = explodeDocuments(it?.documents);
        const files = docs.length ? (docs as URLString[]) : undefined;
        const out: Array<{ timestamp: ISODate; text: string; files?: URLString[] }> = [];

        if (it.effective_date) {
          out.push({
            timestamp: new Date(it.effective_date).toISOString(),
            text: "MOA effective date set",
            files,
          });
        }
        if (it.expiry_date) {
          out.push({
            timestamp: new Date(it.expiry_date).toISOString(),
            text: "MOA expiry date set",
            files,
          });
        }
        return out;
      }

      // Fallback
      return {
        timestamp: new Date().toISOString(),
        text: JSON.stringify(it),
      };
    })
    .flat();
};

/* ---------------- hook ---------------- */

export function useCompanyDetail(company?: Entity) {
  const companyId = company?.id ?? "";

  // A) basics (entity merged with school link status)
  const { partner, isLoading: partnerLoading } = useSchoolPartner(companyId);

  // B) history (by entityId for the current school)
  const { items: historyRaw, isLoading: historyLoading } = useSchoolMoaHistory(companyId);

  const loading = partnerLoading || historyLoading;

  // ---- View model (top cards) ----
  const backendStatusRaw: BackendMoa = (partner as any)?.moaStatus ?? (partner as any)?.status;
  const statusKey = toStatusKey(backendStatusRaw);
  const statusLabel = toStatusLabel(statusKey);

  const name = firstNonEmpty(
    (company as any)?.display_name,
    (partner as any)?.display_name,
    company?.legal_identifier
  );
  const contactPerson = firstNonEmpty(company?.contact_name, (partner as any)?.contact_name);
  const email = firstNonEmpty(company?.contact_email, (partner as any)?.contact_email);
  const phone = firstNonEmpty((company as any)?.contact_phone, (partner as any)?.contact_phone);
  const address = (partner as any)?.address ?? (company as any)?.address ?? "";
  const type = (partner as any)?.type ?? (company as any)?.type ?? "";
  const legalIdentifier = firstNonEmpty(
    company?.legal_identifier,
    (partner as any)?.legal_identifier
  );

  const view = useMemo(() => {
    if (!companyId) return null;
    return {
      id: companyId,
      name,
      contactPerson,
      email,
      phone,
      address,
      type,
      moaStatus: statusKey,
      legalIdentifier,
      validUntil: undefined as string | undefined,
    };
  }, [companyId, name, contactPerson, email, phone, statusKey, address, type, legalIdentifier]);

  // ---- History / request VM for <CompanyHistory /> ----
  const reqData: UiMoaRequest | null = useMemo(() => {
    if (!companyId) return null;

    const normalized = normalizeHistoryItems(historyRaw);

    // Sort by actual timestamp desc before we format to MDY
    const sorted = [...normalized].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

    const history: MoaHistoryItem[] = sorted.map((h, idx) => {
      const files: MoaHistoryFile[] | undefined =
        Array.isArray(h.files) && h.files.length
          ? h.files.map((u) => fileToHistoryFile(u, h.timestamp))
          : undefined;

      return { date: toMDY(h.timestamp), text: h.text, files };
    });

    const requestedAtIso =
      sorted.length > 0
        ? sorted[sorted.length - 1].timestamp // earliest as the "requested" date
        : new Date().toISOString();

    return {
      id: companyId,
      companyName: name ?? "",
      contactPerson: contactPerson ?? "",
      email: email ?? "",
      tin: "",
      industry: "",
      requestedAt: toMDY(requestedAtIso),
      status: statusLabel,
      notes: undefined,
      history,
    };
  }, [companyId, name, contactPerson, email, statusLabel, historyRaw]);

  return { loading, view, reqData };
}
