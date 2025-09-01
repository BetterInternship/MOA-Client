// components/univ/dashboard/cards/DocumentsCard.tsx
"use client";

import { Download } from "lucide-react";

type Doc = { label: string; href: string };

export default function DocumentsCard({ documents }: { documents: Doc[] }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Company Documents</h2>
      <div className="flex flex-wrap gap-2">
        {documents?.length ? (
          documents.map((d) => (
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
  );
}
