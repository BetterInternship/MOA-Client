"use client";

import { useMemo, useState } from "react";
import { Download, Search, FileText, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Company = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  tin: string;
  industry: string;
  reason?: string;
  date: string; // MM/DD/YYYY
  moaStatus: "Active" | "Expired" | "Under Review";
  validUntil?: string; // MM/DD/YY
  documents: { label: string; href: string }[];
  activity: { date: string; text: string }[];
};

const companies: Company[] = [
  {
    id: "VXZb0VYY2JqPC2ZKyEQHr",
    name: "Aurora Systems",
    contactPerson: "Isabel Reyes",
    email: "isabel.reyes@aurorasystems.ph",
    tin: "453-219-874-000",
    industry: "IT Services",
    reason:
      "We're looking to cultivate a strong local talent pipeline and offer students exposure to enterprise-scale IT systems early in their careers.",
    date: "12/02/2024",
    moaStatus: "Active",
    validUntil: "02/15/26",
    documents: [
      { label: "Business Permit", href: "/docs/aurora/business-permit.pdf" },
      { label: "Company Incorporation", href: "/docs/aurora/incorporation.pdf" },
      { label: "BIR Permit", href: "/docs/aurora/bir-permit.pdf" },
    ],
    activity: [
      { date: "08/21/2024", text: "MOA Renewed" },
      { date: "01/20/2023", text: "MOA Renewed" },
      { date: "12/10/2022", text: "MOA Requested" },
      { date: "12/01/2022", text: "Company Registered" },
    ],
  },
  {
    id: "northbridge",
    name: "Northbridge Finance",
    contactPerson: "Katrina Uy",
    email: "katrina.uy@northbridge.com",
    tin: "123-456-789-000",
    industry: "Finance",
    date: "02/01/2025",
    moaStatus: "Under Review",
    documents: [{ label: "Company Profile", href: "/docs/northbridge/profile.pdf" }],
    activity: [
      { date: "02/05/2025", text: "Legal Review Started" },
      { date: "02/01/2025", text: "MOA Request (Negotiated) Submitted" },
    ],
  },
  {
    id: "greenfields",
    name: "GreenFields Manufacturing",
    contactPerson: "Carlos Mendoza",
    email: "carlos.mendoza@greenfields.ph",
    tin: "987-654-321-000",
    industry: "Manufacturing",
    date: "01/15/2025",
    moaStatus: "Active",
    validUntil: "01/15/27",
    documents: [{ label: "Environmental Clearance", href: "/docs/greenfields/denr.pdf" }],
    activity: [
      { date: "01/18/2025", text: "Initial Review Completed" },
      { date: "01/15/2025", text: "MOA Request (Standard) Received" },
    ],
  },
];

export default function CompaniesPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(companies[0].id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
    );
  }, [query]);

  const selected = companies.find((c) => c.id === selectedId) ?? companies[0];

  function StatusBadge({ status }: { status: Company["moaStatus"] }) {
    const map: Record<Company["moaStatus"], string> = {
      Active: "bg-emerald-100 text-emerald-700",
      Expired: "bg-rose-100 text-rose-700",
      "Under Review": "bg-amber-100 text-amber-800",
    };
    return (
      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", map[status])}>{status}</span>
    );
  }

  return (
    <div className="">
      {/* Page header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <p className="text-muted-foreground text-sm">
          Browse partner companies and view MOA details.
        </p>
      </div>

      {/* Two-column layout: left list, right details */}
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        {/* LEFT: searchable list (sticky, scrollable) */}
        <aside className="h-fit lg:sticky lg:top-20">
          <div className="space-y-3 rounded-lg border bg-white p-3">
            <div className="relative">
              <input
                className="bg-background w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Search company..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-md border">
              <ul className="divide-y">
                {filtered.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className={[
                          "flex w-full items-center justify-between px-3 py-2 text-left transition",
                          active ? "bg-accent" : "hover:bg-accent/60",
                        ].join(" ")}
                      >
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-muted-foreground text-xs">{c.industry}</div>
                        </div>
                        <StatusBadge status={c.moaStatus} />
                      </button>
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="text-muted-foreground px-3 py-2 text-sm">No matches found.</li>
                )}
              </ul>
            </div>
          </div>
        </aside>

        {/* RIGHT: all details stack vertically */}
        <section className="space-y-6">
          {/* MOA Details */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">MOA Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-muted-foreground text-sm">MOA Status</div>
                <div className="mt-1">
                  <StatusBadge status={selected.moaStatus} />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Valid Until</div>
                <div className="mt-1 font-medium">{selected.validUntil ?? "—"}</div>
              </div>
            </div>
            <div className="mt-4">
              <button className="hover:bg-accent inline-flex items-center rounded-md border px-3 py-2 text-sm">
                Download MOA
              </button>
            </div>
          </div>

          {/* Company Details */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Company Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Company Name" value={selected.name} />
              <Detail label="TIN" value={selected.tin} />
              <Detail label="Contact Person" value={selected.contactPerson} />
              <Detail label="Email Address" value={selected.email} />
              <Detail label="Industry" value={selected.industry} />
            </div>
            {selected.reason && (
              <div className="mt-4">
                <div className="text-muted-foreground text-sm">Reason</div>
                <p className="mt-1 text-sm">{selected.reason}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Company Documents</h2>
            <div className="flex flex-wrap gap-2">
              {selected.documents.length ? (
                selected.documents.map((d) => (
                  <a
                    key={d.label}
                    href={d.href}
                    download
                    className="bg-secondary rounded-md px-3 py-1.5 text-sm hover:opacity-90"
                  >
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
            {selected.activity.length ? (
              <pre className="bg-muted/50 rounded-md border p-3 text-sm leading-6">
                {selected.activity.map((a) => `[${a.date}] ${a.text}`).join("\n")}
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm">No activity yet.</p>
            )}
          </div>

          {/* Danger */}
          <div className="flex justify-end">
            <button className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">
              Blacklist Company
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}
