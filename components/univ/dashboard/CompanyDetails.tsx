"use client";

import { Download, ShieldAlert } from "lucide-react";
import { Company } from "@/types/company";
import StatusBadge from "./StatusBadge";
import Detail from "./Detail";

export default function CompanyDetails({ company }: { company: Company }) {
  return (
    <section className="h-full space-y-6 overflow-y-auto p-4">
      {/* MOA Details */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">MOA Details</h2>
          <a
            href={`/docs/${company.id}/moa.pdf`}
            download
            className="border-primary bg-primary hover:bg-primary/90 inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download MOA
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground text-sm">MOA Status</div>
            <div className="mt-1">
              <StatusBadge status={company.moaStatus} />
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Valid Until</div>
            <div className="mt-1 font-medium">{company.validUntil ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Company Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label="Company Name" value={company.name} />
          <Detail label="TIN" value={company.tin} />
          <Detail label="Contact Person" value={company.contactPerson} />
          <Detail label="Email Address" value={company.email} />
          <Detail label="Industry" value={company.industry} />
        </div>
        <div className="mt-4">
          <div className="text-muted-foreground text-sm">Reason</div>
          <p className="mt-1 text-sm">{company.reason?.trim() ? company.reason : "—"}</p>
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Company Documents</h2>
        <div className="flex flex-wrap gap-2">
          {company.documents.length ? (
            company.documents.map((d) => (
              <a
                key={d.label}
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
        {company.activity.length ? (
          <pre className="bg-muted/50 rounded-md border p-3 text-sm leading-6">
            {company.activity.map((a) => `[${a.date}] ${a.text}`).join("\n")}
          </pre>
        ) : (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
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
