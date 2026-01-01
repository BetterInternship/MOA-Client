"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import FormTable from "@/components/docs/dashboard/FormTable";
import { getAllSignedForms } from "@/app/api/forms.api";
import { FormRow } from "@/components/docs/dashboard/FormTable";
import {
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";

export default function DocsDashboardPage() {
  const profile = useSignatoryProfile();
  const isCoordinator = Boolean(profile.coordinatorId);

  const {
    data: forms,
    isLoading,
    error,
  } = useQuery<FormRow[]>({
    queryKey: ["my-forms"],
    queryFn: async (): Promise<FormRow[]> => {
      const res = await getAllSignedForms(); // jana dont be confused, this returns all forms astm. just refactor later on
      return (res?.forms as unknown as FormRow[] | undefined) ?? [];
    },
    staleTime: 60_000,
  });

  const rows: FormRow[] = forms ?? [];

  // Temp solution, in the future, lets look at the coordinator forms + autofill forms
  const formTabs = useMemo(() => {
    const seen = new Set<string>();
    return rows.reduce<{ value: string; label: string }[]>((acc, row: FormRow) => {
      const value = row.form_name || String(row.id);
      if (!value || seen.has(value)) return acc;
      seen.add(value);
      acc.push({ value, label: row.form_label || row.form_name || "Untitled Form" });
      return acc;
    }, []);
  }, [rows]);

  const rowsByForm = (formName: string): FormRow[] =>
    rows.filter((row): row is FormRow => {
      if (!row || typeof row !== "object" || !("form_name" in row)) return false;
      return (row as { form_name?: string }).form_name === formName;
    });

  return (
    <div className="max-w-8xl container mx-auto space-y-6 px-4 pt-6 sm:px-10 sm:pt-16">
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
      <div className="">
        {isLoading ? (
          <div className="text-sm text-gray-600">Loading signed documents…</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load signed documents.</div>
        ) : !isCoordinator ? (
          <FormTable rows={rows} isCoordinator={isCoordinator} />
        ) : (
          <VerticalTabs
            orientation="vertical"
            defaultValue="all"
            className="bg- flex flex-col gap-4 md:flex-row md:items-start"
          >
            <VerticalTabsList className="w-[20rem] max-w-[28rem] min-w-[12rem] flex-shrink-0 rounded-[0.33em] border">
              <VerticalTabsTrigger value="all" className="text-left">
                All Forms
              </VerticalTabsTrigger>

              {formTabs.map((tab) => (
                <VerticalTabsTrigger
                  key={tab.value}
                  value={tab.value}
                  title={tab.label}
                  className="text-left"
                >
                  {tab.label}
                </VerticalTabsTrigger>
              ))}
            </VerticalTabsList>

            <div className="min-w-0 flex-1">
              <TabsContent value="all" className="mt-0">
                <Card className="space-y-3 p-3">
                  <FormTable rows={rows} isCoordinator={isCoordinator} exportEnabled={false} />
                </Card>
              </TabsContent>

              {formTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  <Card className="space-y-3 p-3">
                    <FormTable
                      rows={rowsByForm(tab.value)}
                      isCoordinator={isCoordinator}
                      exportEnabled
                      exportLabel={tab.label}
                    />
                  </Card>
                </TabsContent>
              ))}
            </div>
          </VerticalTabs>
        )}
      </div>
    </div>
  );
}
