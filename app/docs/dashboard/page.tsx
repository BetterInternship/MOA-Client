"use client";

import { useMemo, useState } from "react";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { IMyForm, useMyForms } from "@/components/docs/forms/myforms.ctx";
import MyFormsTable from "@/components/docs/dashboard/FormTable";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { HorizontalScroller } from "@/components/shared/horizontal-scroller";

export default function DocsDashboardPage() {
  const { forms, loading, error } = useMyForms();
  const profile = useSignatoryProfile();
  const isCoordinator = Boolean(profile.coordinatorId);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("all");

  // Temp solution, in the future, lets look at the coordinator forms + autofill forms
  const formTabs = useMemo(() => {
    return forms.reduce<{ id: string; label: string }[]>((acc, form: IMyForm) => {
      const id = form.label;
      if (!id || !!acc.find((tab) => tab.id === id)) return acc;
      acc.push({ id, label: form.label || "Untitled Form" });
      return acc;
    }, []);
  }, [forms]);

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
          <>
            {/* Mobile Layout */}
            {isMobile ? (
              <div className="space-y-4">
                {/* Mobile Tabs Scroll */}
                <HorizontalScroller className="rounded-[0.33em] border border-gray-200 bg-white p-2">
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
                </HorizontalScroller>

                {/* Mobile Content */}
                {activeTab === "all" && (
                  <Card className="space-y-3 p-3">
                    <MyFormsTable rows={forms} isCoordinator={isCoordinator} />
                  </Card>
                )}

                {formTabs.map((tab) =>
                  activeTab === tab.id ? (
                    <Card key={tab.id} className="space-y-3 p-3">
                      <MyFormsTable
                        rows={forms.filter((form) => form.label === tab.label)}
                        isCoordinator={isCoordinator}
                      />
                    </Card>
                  ) : null
                )}
              </div>
            ) : (
              /* Desktop Layout */
              <VerticalTabs
                orientation="vertical"
                defaultValue="all"
                className="flex flex-col gap-4 md:flex-row md:items-start"
              >
                {/* Desktop Tabs List */}
                <VerticalTabsList className="w-[20rem] max-w-[28rem] min-w-[12rem] flex-col gap-0 rounded-[0.33em] border border-gray-200 bg-white p-0">
                  <VerticalTabsTrigger
                    value="all"
                    className="w-full rounded-none border-b px-4 py-2 text-left"
                  >
                    All Forms
                  </VerticalTabsTrigger>

                  {formTabs.map((tab) => (
                    <VerticalTabsTrigger
                      key={tab.id}
                      value={tab.id}
                      title={tab.label}
                      className="w-full rounded-none border-b px-4 py-2 text-left"
                    >
                      {tab.label}
                    </VerticalTabsTrigger>
                  ))}
                </VerticalTabsList>

                <div className="min-w-0 flex-1">
                  <TabsContent value="all" className="mt-0">
                    <Card className="space-y-3 p-3">
                      <MyFormsTable rows={forms} isCoordinator={isCoordinator} />
                    </Card>
                  </TabsContent>

                  {formTabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="mt-0">
                      <Card className="space-y-3 p-3">
                        <MyFormsTable
                          rows={forms.filter((form) => form.label === tab.label)}
                          isCoordinator={isCoordinator}
                        />
                      </Card>
                    </TabsContent>
                  ))}
                </div>
              </VerticalTabs>
            )}
          </>
        )}
      </div>
    </div>
  );
}
