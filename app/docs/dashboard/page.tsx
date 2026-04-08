"use client";

import { useMemo, useState, useRef } from "react";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import {
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Pen,
  Clock,
  Check,
  CircleSlash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { IMyForm, useMyForms } from "@/components/docs/forms/myforms.ctx";
import MyFormsTable from "@/components/docs/dashboard/FormTable";
import { cn } from "@/lib/utils";

export default function DocsDashboardPage() {
  const { forms, loading, error } = useMyForms();
  const profile = useSignatoryProfile();
  const isLoggedIn = Boolean(profile?.email);
  const isCoordinator = Boolean(profile.coordinatorId);
  const [activeTab, setActiveTab] = useState("needs_signing");

  const statuses = [
    {
      id: "needs_signing",
      label: "Needs signing",
      icon: Pen,
      filter: (form: IMyForm) => {
        const lastUnsignedSigningParty = form.signing_parties
          .toSorted((a, b) => a.order - b.order)
          .find((signingParty) => !signingParty.signed);
        const mySigningParty = form.signing_parties.find(
          (signingParty) =>
            signingParty.signatory_account?.email === profile.email && !signingParty.signed
        );
        const rejectionReason = form.rejection_reason;

        return (
          lastUnsignedSigningParty?._id === mySigningParty?._id &&
          !form.signed_document_id &&
          !rejectionReason
        );
      },
    },
    {
      id: "completed",
      label: "Completed",
      icon: Check,
      filter: (form: IMyForm) => {
        return Boolean(form.signed_document_id);
      },
    },
    {
      id: "rejected",
      label: "Cancelled",
      icon: CircleSlash2,
      filter: (form: IMyForm) => {
        return Boolean(form.rejection_reason);
      },
    },
    {
      id: "pending_signatures",
      label: "Pending other signatures",
      icon: Clock,
      filter: (form: IMyForm) => {
        const lastUnsignedSigningParty = form.signing_parties
          .toSorted((a, b) => a.order - b.order)
          .find((signingParty) => !signingParty.signed);
        const mySigningParty = form.signing_parties.find(
          (signingParty) =>
            signingParty.signatory_account?.email === profile.email && !signingParty.signed
        );

        return lastUnsignedSigningParty?._id !== mySigningParty?._id;
      },
    },
  ];

  if (profile.loading || !isLoggedIn) {
    return null;
  }

  return (
    <div className="max-w-8xl container mx-auto space-y-6 px-4 pt-6 sm:px-10 sm:pt-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText>Forms</HeaderText>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          View and sign internship forms.
        </p>
      </div>

      {/* Table */}
      <div>
        {loading ? (
          <div className="text-sm text-gray-600">Loading signed documents…</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load signed documents.</div>
        ) : (
          <div className="space-y-2">
            {/* Tabs with External Arrows */}
            <div className="scrollbar-hide flex flex-1 flex-row gap-2 overflow-x-auto">
              {statuses.map((status) => {
                const IconComponent = status.icon;

                return (
                  <button
                    key={status.id}
                    onClick={() => setActiveTab(status.id)}
                    title={status.label}
                    className={cn(
                      "flex w-fit shrink-0 items-center gap-2 rounded-[0.33em] px-3 py-2 text-sm whitespace-nowrap transition-colors",
                      activeTab === status.id ? "bg-primary text-white" : "hover:bg-gray-50"
                    )}
                  >
                    <IconComponent className="w-4" />
                    {status.label}
                  </button>
                );
              })}
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex w-fit shrink-0 items-center gap-2 rounded-[0.33em] px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  activeTab === "all" ? "bg-primary text-white" : "hover:bg-gray-50"
                )}
              >
                <Newspaper className="w-4" />
                All Forms
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
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
