"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { IMyForm, useMyForms } from "@/components/docs/forms/myforms.ctx";
import MyFormsTable from "@/components/docs/dashboard/FormTable";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DocsDashboardPage() {
  const router = useRouter();
  const { forms, loading, error } = useMyForms();
  const profile = useSignatoryProfile();
  const isLoggedIn = Boolean(profile?.email);
  const isCoordinator = Boolean(profile.coordinatorId);
  const [activeTab, setActiveTab] = useState("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const statuses = [
    {
      id: "needs_signing",
      label: "Needs signing",
      filter: (form: IMyForm) => {
        const lastUnsignedSigningParty = form.signing_parties
          .toSorted((a, b) => a.order - b.order)
          .find((signingParty) => !signingParty.signed);
        const mySigningParty = form.signing_parties.find(
          (signingParty) =>
            signingParty.signatory_account?.email === profile.email && !signingParty.signed
        );
        
        return lastUnsignedSigningParty?._id === mySigningParty?._id && !Boolean(form.signed_document_id);
      }
    },
    {
      id: "pending_signatures",
      label: "Pending other signatures",
      filter: (form: IMyForm) => {
        const lastUnsignedSigningParty = form.signing_parties
          .toSorted((a, b) => a.order - b.order)
          .find((signingParty) => !signingParty.signed);
        const mySigningParty = form.signing_parties.find(
          (signingParty) =>
            signingParty.signatory_account?.email === profile.email && !signingParty.signed
        );

        return lastUnsignedSigningParty?._id !== mySigningParty?._id;
      }
    },
    {
      id: "completed",
      label: "Completed",
      filter: (form: IMyForm) => {
        return Boolean(form.signed_document_id);
      }
    },
  ]

  useEffect(() => {
    if (!profile.loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [profile.loading, isLoggedIn, router]);

  if (profile.loading || !isLoggedIn) {
    return null;
  }

  return (
    <div className="max-w-8xl container mx-auto space-y-6 px-4 pt-6 sm:px-10 sm:pt-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText>My Signed Forms</HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          All internship forms you've successfully signed and completed.
        </p>
      </div>

      {/* Table */}
      <div>
        {loading ? (
          <div className="text-sm text-gray-600">Loading signed documents…</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load signed documents.</div>
        ) : (
          <div className="space-y-4">
            {/* Tabs with External Arrows */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => scroll("left")}
                className="flex-shrink-0 rounded-lg border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>

              <div
                ref={scrollContainerRef}
                className="scrollbar-hide flex flex-1 flex-row gap-2 overflow-x-auto rounded-[0.33em] border border-gray-200 bg-white p-2"
              >
                <button
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "w-fit flex-shrink-0 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                    activeTab === "all" ? "bg-primary text-white" : "hover:bg-gray-50"
                  )}
                >
                  All Forms
                </button>

                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setActiveTab(status.id)}
                    title={status.label}
                    className={cn(
                      "w-fit flex-shrink-0 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                      activeTab === status.id ? "bg-primary text-white" : "hover:bg-gray-50"
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => scroll("right")}
                className="flex-shrink-0 rounded-lg border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            {activeTab === "all" && (
              <Card className="space-y-3 p-3">
                <MyFormsTable rows={forms} isCoordinator={isCoordinator} />
              </Card>
            )}

            {statuses.map((status) => {
              return activeTab === status.id ? (
                <Card key={status.id} className="space-y-3 p-3">
                  <MyFormsTable
                    rows={forms.filter(status.filter)}
                    isCoordinator={isCoordinator}
                    exportEnabled
                    exportLabel={status.label}
                    exportFormName={""}
                  />
                </Card>
              ) : null
            })}
          </div>
        )}
      </div>
    </div>
  );
}
