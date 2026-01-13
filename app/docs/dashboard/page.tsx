"use client";

import { useMemo, useState, useRef } from "react";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { IMyForm, useMyForms } from "@/components/docs/forms/myforms.ctx";
import MyFormsTable from "@/components/docs/dashboard/FormTable";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function DocsDashboardPage() {
  const { forms, loading, error } = useMyForms();
  const profile = useSignatoryProfile();
  const isCoordinator = Boolean(profile.coordinatorId);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Temp solution, in the future, lets look at the coordinator forms + autofill forms
  const formTabs = useMemo(() => {
    return forms.reduce<{ id: string; label: string }[]>((acc, form: IMyForm) => {
      const id = form.label;
      if (!id || !!acc.find((tab) => tab.id === id)) return acc;
      acc.push({ id, label: form.label || "Untitled Form" });
      return acc;
    }, []);
  }, [forms]);
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };
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

                {formTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.label}
                    className={cn(
                      "w-fit flex-shrink-0 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                      activeTab === tab.id ? "bg-primary text-white" : "hover:bg-gray-50"
                    )}
                  >
                    {tab.label}
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
                <MyFormsTable
                  rows={forms}
                  isCoordinator={isCoordinator}
                  exportEnabled
                  exportLabel="All Signed Forms"
                />
              </Card>
            )}

            {formTabs.map((tab) =>
              activeTab === tab.id ? (
                <Card key={tab.id} className="space-y-3 p-3">
                  <MyFormsTable
                    rows={forms.filter((form) => form.label === tab.label)}
                    isCoordinator={isCoordinator}
                    exportEnabled
                    exportLabel={tab.label}
                  />
                </Card>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
