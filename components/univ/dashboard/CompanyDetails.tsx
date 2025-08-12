// components/univ/dashboard/CompanyDetails.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import StatusBadge from "./StatusBadge";
import Detail from "./Detail";

type ApiDetail = {
  entity: {
    uid: string;
    displayName: string;
    legalName: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    entityDocuments: { documentType: string; url: string }[];
  };
  status: "registered" | "approved" | "blacklisted" | null;
  logs: { timestamp: string; update: string; file: string | null }[];
  notes: { id: string; authorName: string; message: string; timestamp: string }[];
  requests: { newEntity: { timestamp: string }[]; moa: { timestamp: string; schoolID: string }[] };
};

// Use the same shape as your list rows:
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

const firstNonEmpty = (...vals: (string | undefined | null)[]) =>
  vals.find((v) => v !== undefined && v !== null && String(v).trim() !== "") ?? "";

export default function CompanyDetails({ company }: { company: CompanyRow }) {
  const [detail, setDetail] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(false);

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
        console.log("Company detail loaded:", data);
      } catch (e) {
        if ((e as any).name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [company.id]);

  const view = useMemo(() => {
    const d = detail;
    return {
      id: company.id,
      moaStatus: company.status ?? d?.status ?? "registered",
      validUntil: undefined, // not modeled yet

      // Prefer non-empty seed, else API value
      name: firstNonEmpty(company.name, d?.entity.displayName),
      contactPerson: firstNonEmpty(company.contactName, d?.entity.contactName),
      email: firstNonEmpty(company.contactEmail, d?.entity.contactEmail),
      phone: firstNonEmpty(company.contactPhone, d?.entity.contactPhone),

      documents: company.documents?.length
        ? company.documents.map((doc) => ({ label: doc.documentType, href: doc.url }))
        : (d?.entity.entityDocuments ?? []).map((doc) => ({
            label: doc.documentType,
            href: doc.url,
          })),

      activity: d
        ? [
            ...d.logs.map((l) => ({
              date: new Date(l.timestamp).toLocaleDateString("en-US"),
              text: `${l.update}${l.file ? ` (ref: ${l.file.split("/").pop()})` : ""}`,
            })),
            ...d.notes.map((n) => ({
              date: new Date(n.timestamp).toLocaleDateString("en-US"),
              text: `Note by ${n.authorName}: ${n.message}`,
            })),
          ].sort((a, b) => +new Date(b.date) - +new Date(a.date))
        : [],
    };
  }, [company, detail]);

  return (
    <section className="h-full space-y-6 overflow-y-auto p-4">
      {/* MOA Details */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">MOA Details</h2>
          {/* Use a dummy link for now */}
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
              <StatusBadge status={view.moaStatus} />
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

      {/* Activity Log */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Activity Log</h2>
        {view.activity.length ? (
          <pre className="bg-muted/50 rounded-md border p-3 text-sm leading-6">
            {view.activity.map((a) => `[${a.date}] ${a.text}`).join("\n")}
          </pre>
        ) : (
          <p className="text-muted-foreground text-sm">
            {loading ? "Loading…" : "No activity yet."}
          </p>
        )}
      </div>

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
