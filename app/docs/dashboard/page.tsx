"use client";

import { useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import FormTable from "@/components/docs/dashboard/FormTable";
import { getAllSignedForms } from "@/app/api/forms.api";
import { getDocsSelf } from "@/app/api/docs.api";
import { SignedDoc } from "@/components/docs/dashboard/FormTable";

export default function DocsDashboardPage() {
  const { data } = useQuery({
    queryKey: ["docs-self"],
    queryFn: getDocsSelf,
    staleTime: 60_000,
  });

  const user = data?.profile as
    | { id: string; email: string; name?: string; coordinatorId?: string; isGodMode: boolean }
    | undefined;
  const isCoordinator = Boolean(user?.coordinatorId);

  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery<SignedDoc[]>({
    queryKey: ["docs-signed"],
    queryFn: async () => {
      const res = await getAllSignedForms();
      return res?.signedDocuments ?? [];
    },
    staleTime: 60_000,
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 pt-6 sm:px-10 sm:pt-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText>My Signed Forms</HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          All internship forms you’ve successfully signed and completed.
        </p>
      </div>

      {/* Table */}
      <Card className="p-3 sm:p-4">
        {isLoading ? (
          <div className="text-sm text-gray-600">Loading signed documents…</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load signed documents.</div>
        ) : (
          <FormTable rows={rows} isCoordinator={isCoordinator} />
        )}
      </Card>
    </div>
  );
}
