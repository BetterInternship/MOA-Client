// components/univ/dashboard/CompanyDetails.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import StatusBadge from "./StatusBadge";
import Detail from "./Detail";
import CompanyRequestHistory from "@/components/univ/shared/CompanyRequestHistory";

// UI MoA types (your existing UI shape)
import type {
  MoaRequest as UiMoaRequest,
  MoaHistoryItem,
  MoaHistoryFile,
  MoaStatus,
} from "@/types/moa-request";

// DB types (the source of truth)
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
  UUID,
} from "@/types/db";

// -------- List row shape from your page --------
type CompanyRow = {
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

// -------- API response using your db.ts types --------
type ApiDetail = {
  entity: Entity;
  schoolEntity?: SchoolEntity; // status for this school
  logs: EntityLog[];
  notes: PrivateNote[];
  requests: {
    newEntity: NewEntityRequest[];
    moa: DbMoaRequest[];
  };
  messages?: Message[]; // threaded actions/attachments, etc.
};

// ===================== Utils =====================
const firstNonEmpty = (...vals: (string | undefined | null)[]) =>
  vals.find((v) => v !== undefined && v !== null && String(v).trim() !== "") ?? "";

const toMDY = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// Map SchoolEntity.status → UI MoaStatus chip
const toMoaStatus = (s?: SchoolEntity["status"] | null): MoaStatus => {
  switch (s) {
    case "approved":
      return "Approved";
    case "blacklisted":
      return "Denied"; // if you later add "Blacklisted", adjust the chip mapping
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

// ===================== Component =====================
export default function CompanyDetails({ company }: { company: CompanyRow }) {
  const [detail, setDetail] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch company detail
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
  }, [company.id]);

  // View model for top sections (name/contact/docs/status…)
  const view = useMemo(() => {
    const d = detail;

    // Prefer list row seed; fall back to API entity values.
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

    // Status for the MOA Details badge
    const badgeStatus = toMoaStatus(d?.schoolEntity?.status);

    return {
      id: company.id,
      name,
      contactPerson,
      email,
      phone,
      documents,
      badgeStatus,
      validUntil: undefined as string | undefined, // not modeled yet
    };
  }, [company, detail]);

  // Build your UI MoaRequest for <CompanyRequestHistory />
  const reqData: UiMoaRequest = useMemo(() => {
    const d = detail;

    // requestedAt: earliest newEntity req → earliest MOA req → today
    const allReqTimes: ISODate[] = [
      ...(d?.requests?.newEntity ?? []).map((r) => r.timestamp),
      ...(d?.requests?.moa ?? []).map((r) => r.timestamp),
    ];
    const earliestIso =
      allReqTimes.length > 0
        ? new Date(Math.min(...allReqTimes.map((t) => +new Date(t)))).toISOString()
        : new Date().toISOString();

    // History from logs
    const logItems: MoaHistoryItem[] =
      d?.logs.map((l) => {
        const files = l.file ? [fileToHistoryFile(l.file, l.timestamp)] : undefined;
        // Human text for update
        const text =
          l.update === "note" ? "Note added" : l.update.charAt(0).toUpperCase() + l.update.slice(1);
        return { date: toMDY(l.timestamp), text, files };
      }) ?? [];

    // History from private notes
    const noteItems: MoaHistoryItem[] =
      d?.notes.map((n) => ({
        date: toMDY(n.timestamp),
        text: `Private note by ${n.authorId}: ${n.message}`,
      })) ?? [];

    // History from messages (threaded actions)
    const messageItems: MoaHistoryItem[] = (d?.messages ?? []).map((m) => {
      const label = m.action === "approve" ? "Approved" : m.action === "deny" ? "Denied" : "Reply";

      const files: MoaHistoryFile[] | undefined = (m.attachments ?? []).length
        ? (m.attachments ?? []).map((u, idx) => {
            const name = u.split("/").pop() || `attachment-${idx + 1}`;
            return { id: `${m.timestamp}-${name}`, name, url: u };
          })
        : undefined;

      const extra = m.comments ? ` — ${m.comments}` : "";
      return {
        date: toMDY(m.timestamp),
        text: `${label}${extra}`,
        files,
      };
    });

    // Optional: history from requests (explicit markers)
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

    // Merge and sort descending by date
    const merged = [...logItems, ...noteItems, ...messageItems, ...requestItems].sort(
      (a, b) => +new Date(b.date) - +new Date(a.date)
    );

    return {
      id: company.id,
      companyName: view.name,
      contactPerson: view.contactPerson || "",
      email: view.email || "",
      tin: "", // not present in Entity; wire up if you add it
      industry: "", // not present in Entity; wire up if you add it
      requestedAt: toMDY(earliestIso),
      status: toMoaStatus(d?.schoolEntity?.status),
      notes: undefined,
      history: merged,
    };
  }, [company.id, detail, view]);

  return (
    <section className="h-full space-y-6 overflow-y-auto p-4">
      {/* MOA Details */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">MOA Details</h2>
          <a
            href={`/docs/${view.id}/moa.pdf`}
            download
            className="border-primary bg-primary hover:bg-primary/90 inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Preparing..." : "Download MOA"}
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground text-sm">MOA Status</div>
            <div className="mt-1">
              <StatusBadge status={view.badgeStatus} />
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Valid Until</div>
            <div className="mt-1 font-medium">{view.validUntil ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Company Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label="Company Name" value={view.name} />
          <Detail label="Contact Person" value={view.contactPerson} />
          <Detail label="Email Address" value={view.email} />
          <Detail label="Phone" value={view.phone} />
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Company Documents</h2>
        <div className="flex flex-wrap gap-2">
          {view.documents.length ? (
            view.documents.map((d) => (
              <a
                key={`${d.label}-${d.href}`}
                href={d.href}
                download
                className="border-primary text-primary hover:bg-primary/5 inline-flex items-center rounded-md border bg-white px-3 py-1.5 text-sm font-medium shadow-sm"
              >
                <Download className="mr-1.5 h-4 w-4" />
                {d.label}
              </a>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No documents uploaded.</span>
          )}
        </div>
      </div>

      {/* Company History */}
      <CompanyRequestHistory req={reqData} />

      {/* Actions */}
      <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Actions</h2>
        <button className="inline-flex items-center rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:cursor-pointer hover:bg-rose-100">
          <ShieldAlert className="mr-2 h-4 w-4" />
          Blacklist Company
        </button>
      </div>
    </section>
  );
}
