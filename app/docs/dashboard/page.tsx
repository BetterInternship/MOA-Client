"use client";

import { useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import FormCard from "@/components/docs/dashboard/FormCard";
import { getAllSignedForms } from "@/app/api/forms.api";

// Minimal shape for signed documents we expect from the API. Keep optional to be
// resilient to backend shape differences and keep the UI lean.
type SignedDoc = {
  id?: string;
  form_name?: string;
  date_made?: string; // ISO
  url?: string;
};

export default function DocsDashboardPage() {
  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery<SignedDoc[], unknown>({
    queryKey: ["docs-signed"],
    queryFn: async () => {
      const res = await getAllSignedForms();
      return res?.signedDocuments ?? [];
    },
    staleTime: 60_000,
  });

  console.log("Signed documents:", rows);

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-6 sm:px-10 sm:pt-16">
      {/* Header */}
      <div className="mb-6 space-y-2 sm:mb-8">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText>My Signed Forms</HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          All internship forms you’ve successfully signed and completed.
        </p>
      </div>

      {/* Panel */}
      <Card className="p-3 sm:p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load signed documents.</div>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground text-sm">You haven’t signed any documents yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rows.map((row) => (
              <FormCard
                key={row.id ?? `${row.form_name ?? "row"}-${Math.random()}`}
                title={row.form_name ?? "Form"}
                requestedAt={row.date_made}
                downloadUrl={row.url}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/** Minimal loading card */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-800">
      <div className="flex items-center gap-2.5">
        <div className="bg-muted h-7 w-7 animate-pulse rounded-lg" />
        <div className="flex-1">
          <div className="bg-muted h-3 w-40 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-2.5 w-28 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-5 w-20 animate-pulse rounded-full" />
      </div>
      <div className="mt-3.5 flex gap-1.5">
        <div className="bg-muted h-8 w-20 animate-pulse rounded" />
        <div className="bg-muted h-8 w-24 animate-pulse rounded" />
      </div>
    </div>
  );
}
