// hooks/useCompanyDetail.ts
"use client";

import { useMemo } from "react";
import type { Entity, URLString, ISODate } from "@/types/db";
import type {
  MoaRequest as UiMoaRequest,
  MoaHistoryItem,
  MoaHistoryFile,
} from "@/types/moa-request";
import { useSchoolPartner } from "@/app/api/school.api";
import { useSchoolMoaHistory } from "@/app/api/school.api";

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

/** Normalize server history into { timestamp, text, files? }[] */
const normalizeHistoryItems = (
  raw: any[]
): Array<{ timestamp: ISODate; text: string; files?: URLString[] }> => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      // preferred shape
      if (it?.timestamp && it?.text)
        return it as { timestamp: ISODate; text: string; files?: URLString[] };

      // legacy example
      if (it?.effective_date || it?.expiry_date) {
        const out: Array<{ timestamp: ISODate; text: string }> = [];
        if (it.effective_date)
          out.push({
            timestamp: new Date(it.effective_date).toISOString(),
            text: "MOA effective date set",
          });
        if (it.expiry_date)
          out.push({
            timestamp: new Date(it.expiry_date).toISOString(),
            text: "MOA expiry date set",
          });
        return out;
      }

      // last-resort stringify
      return { timestamp: new Date().toISOString(), text: JSON.stringify(it) };
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
  const statusKey = toStatusKey(backendStatusRaw); // "approved" | "registered" | "blacklisted" | ...
  const statusLabel = toStatusLabel(statusKey); // "Approved" | "Registered" | "Blacklisted" | "Under Review"

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
      // For StatusBadge, pass the *key* (lowercase) so your color map matches.
      moaStatus: statusKey,
      validUntil: undefined as string | undefined,
    };
  }, [companyId, name, contactPerson, email, phone, statusKey]);

  // ---- History / request VM for <CompanyHistory /> ----
  const reqData: UiMoaRequest | null = useMemo(() => {
    if (!companyId) return null;

    const normalized = normalizeHistoryItems(historyRaw);
    const history: MoaHistoryItem[] = normalized
      .map((h) => {
        const files: MoaHistoryFile[] | undefined =
          Array.isArray(h.files) && h.files.length
            ? h.files.map((u, idx) => {
                const nm = (u as string).split("/").pop() || `attachment-${idx + 1}`;
                return { id: `${h.timestamp}-${nm}`, name: nm, url: u as string };
              })
            : undefined;

        return { date: toMDY(h.timestamp), text: h.text, files };
      })
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const requestedAtIso =
      normalized.length > 0
        ? normalized.reduce(
            (min, x) => (x.timestamp < min ? x.timestamp : min),
            normalized[0].timestamp
          )
        : new Date().toISOString();

    return {
      id: companyId,
      companyName: name ?? "",
      contactPerson: contactPerson ?? "",
      email: email ?? "",
      tin: "",
      industry: "",
      requestedAt: toMDY(requestedAtIso),
      // CompanyHistory just displays text → give it the human label
      status: statusLabel,
      notes: undefined,
      history,
    };
  }, [companyId, name, contactPerson, email, statusLabel, historyRaw]);

  return { loading, view, reqData };
}
