"use client";

import { useEffect, useMemo, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Download, ShieldAlert } from "lucide-react";

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
  {
    id: "pacificreach",
    name: "Pacific Reach Logistics",
    contactPerson: "Jorge Santos",
    email: "jorge.santos@pacificreach.com",
    tin: "652-314-987-000",
    industry: "Logistics & Supply Chain",
    reason:
      "Seeking partnership to place OJT students in warehouse operations and supply chain optimization projects.",
    date: "11/10/2024",
    moaStatus: "Active",
    validUntil: "11/10/2026",
    documents: [
      { label: "Business Permit", href: "/docs/pacificreach/business-permit.pdf" },
      { label: "DTI Registration", href: "/docs/pacificreach/dti.pdf" },
    ],
    activity: [
      { date: "11/15/2024", text: "MOA Signed" },
      { date: "11/10/2024", text: "Company Registered" },
    ],
  },
  {
    id: "manilamedical",
    name: "Manila Medical Solutions",
    contactPerson: "Dr. Felicia Cruz",
    email: "felicia.cruz@manilamedical.com.ph",
    tin: "754-198-223-000",
    industry: "Healthcare",
    reason:
      "Partnering to provide internships for nursing, pharmacy, and medical technology students.",
    date: "09/05/2024",
    moaStatus: "Expired",
    validUntil: "09/05/2022",
    documents: [
      { label: "DOH Accreditation", href: "/docs/manilamedical/doh.pdf" },
      { label: "Business Permit", href: "/docs/manilamedical/business-permit.pdf" },
    ],
    activity: [
      { date: "09/10/2022", text: "MOA Signed" },
      { date: "09/05/2024", text: "MOA Expired" },
    ],
  },
  {
    id: "freshharvest",
    name: "Fresh Harvest Foods Corp.",
    contactPerson: "Angela Bautista",
    email: "angela.bautista@freshharvest.ph",
    tin: "821-457-693-000",
    industry: "Food & Beverage",
    reason:
      "Looking for students in food technology and marketing for new product development campaigns.",
    date: "08/12/2024",
    moaStatus: "Under Review",
    documents: [{ label: "FDA License", href: "/docs/freshharvest/fda.pdf" }],
    activity: [
      { date: "08/14/2024", text: "Initial Review Completed" },
      { date: "08/12/2024", text: "MOA Request Submitted" },
    ],
  },
  {
    id: "citrusinnovations",
    name: "Citrus Innovations Inc.",
    contactPerson: "Luis Fernandez",
    email: "luis.fernandez@citrusinnovations.com",
    tin: "453-872-315-000",
    industry: "Renewable Energy",
    reason:
      "Providing opportunities for engineering students to work on sustainable energy projects and research.",
    date: "10/20/2024",
    moaStatus: "Active",
    validUntil: "10/20/2026",
    documents: [
      { label: "SEC Registration", href: "/docs/citrusinnovations/sec.pdf" },
      { label: "DOE Accreditation", href: "/docs/citrusinnovations/doe.pdf" },
    ],
    activity: [
      { date: "10/25/2024", text: "MOA Signed" },
      { date: "10/20/2024", text: "Company Registered" },
    ],
  },
];

const STORAGE_KEY = (userId?: string) => `moa:asideWidth:${userId ?? "anon"}`;

export default function CompaniesPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(companies[0].id);

  // persist resizable sizes per user (percentages)
  const userId = undefined; // <-- swap with your real user id if available
  const [sizes, setSizes] = useState<number[] | null>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY(userId)) : null;
    setSizes(raw ? JSON.parse(raw) : [26, 74]); // default 26% | 74%
  }, [userId]);

  function handleLayout(next: number[]) {
    setSizes(next);
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(next));
  }

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

  if (!sizes) {
    // simple skeleton while we read localStorage
    return (
      <div className="space-y-2">
        <div className="bg-muted h-6 w-48 rounded" />
        <div className="bg-muted/60 h-[calc(100vh-180px)] rounded border" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <p className="text-muted-foreground text-sm">
          Browse partner companies and view MOA details.
        </p>
      </div>

      {/* Resizable two-column layout */}
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={handleLayout}
        className="h-[calc(100vh-180px)] rounded-md border lg:overflow-hidden"
      >
        {/* LEFT: searchable list */}
        <ResizablePanel defaultSize={sizes[0]} minSize={18} maxSize={50}>
          <aside className="h-full overflow-y-auto">
            <div className="space-y-3 p-3">
              <div className="relative">
                <input
                  className="bg-background w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Search company..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="rounded-md border">
                <ul className="divide-y">
                  {filtered.map((c) => {
                    const active = c.id === selectedId;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => setSelectedId(c.id)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${
                            active ? "bg-accent" : "hover:bg-accent/60"
                          }`}
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: details */}
        <ResizablePanel defaultSize={sizes[1]} minSize={40}>
          <section className="h-full space-y-6 overflow-y-auto p-4">
            {/* MOA Details */}
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">MOA Details</h2>
                <a
                  href={`/docs/${selected.id}/moa.pdf`}
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
                    <StatusBadge status={selected.moaStatus} />
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Valid Until</div>
                  <div className="mt-1 font-medium">{selected.validUntil ?? "—"}</div>
                </div>
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
              <div className="mt-4">
                <div className="text-muted-foreground text-sm">Reason</div>
                <p className="mt-1 text-sm">{selected.reason?.trim() ? selected.reason : "—"}</p>
              </div>
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
              {selected.activity.length ? (
                <pre className="bg-muted/50 rounded-md border p-3 text-sm leading-6">
                  {selected.activity.map((a) => `[${a.date}] ${a.text}`).join("\n")}
                </pre>
              ) : (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              )}
            </div>

            {/* Actions */}
            <div className="rounded-lg border bg-white p-4 flex items-center gap-4">
              <h2 className="text-lg font-semibold">Actions</h2>
              <button className="inline-flex items-center rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 hover:cursor-pointer">
                <ShieldAlert className="mr-2 h-4 w-4" />
                Blacklist Company
              </button>
            </div>
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/* --- tiny helpers --- */
function StatusBadge({ status }: { status: Company["moaStatus"] }) {
  const map: Record<Company["moaStatus"], string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Expired: "bg-rose-100 text-rose-700",
    "Under Review": "bg-amber-100 text-amber-800",
  };
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>;
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}
