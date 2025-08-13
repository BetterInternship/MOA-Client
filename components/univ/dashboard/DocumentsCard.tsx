// components/univ/dashboard/cards/DocumentsCard.tsx
"use client";

import { Download } from "lucide-react";

type Doc = { label: string; href: string };

// Fallback demo docs (used when `documents` is empty)
const DEFAULT_DOCS: Doc[] = [
  { label: "MOA — Countersigned (PDF)", href: "/docs/demo/MOA_countersigned.pdf" },
  { label: "Notarized Page (PDF)", href: "/docs/demo/notarized-page.pdf" },
  { label: "SEC Registration (PDF)", href: "/docs/demo/SEC_registration.pdf" },
  { label: "BIR Registration (PDF)", href: "/docs/demo/BIR_registration.pdf" },
];

export default function DocumentsCard({ documents }: { documents: Doc[] }) {
  // If no docs were passed in, show our default pack
  const list = Array.isArray(documents) && documents.length > 0 ? documents : DEFAULT_DOCS;

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Company Documents</h2>

      <div className="flex flex-wrap gap-2">
        {list.map((d) => (
          <a
            key={`${d.label}-${d.href}`}
            href={d.href}
            download
            className="border-primary text-primary hover:bg-primary/5 inline-flex items-center rounded-md border bg-white px-3 py-1.5 text-sm font-medium"
          >
            <Download className="mr-1.5 h-4 w-4" />
            {d.label}
          </a>
        ))}
      </div>
    </div>
  );
}
