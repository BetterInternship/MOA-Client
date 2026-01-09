"use client";

import React from "react";
import MyFormRow, { FormItem } from "../MyFormRow";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getFormFields } from "@/app/api/forms.api";

export default function MyFormsTableLike({
  rows,
  onPreview,
  onOpenAutoSignForm,
  toggleAutoSign,
  togglingName,
  isCoordinator,
}: {
  rows: FormItem[];
  onPreview: (name: string) => void;
  onOpenAutoSignForm: (name: string, party: string, currentValue: boolean) => void;
  toggleAutoSign: (name: string, party: string, currentValue: boolean) => void;
  togglingName?: string | null;
  isCoordinator?: boolean;
}) {
  // Pull the form data eeeeeeeeeeee
  const forms = rows.map((f) => {
    const r = useQuery({
      queryKey: ["form-fields", f.name],
      queryFn: async () => await getFormFields(f.name),
      enabled: !!f.name,
    });

    return { ...f, ...r };
  });

  return (
    <div className="space-y-4">
      <div
        role="row"
        className="grid grid-cols-12 items-center gap-3 rounded-[0.33em] border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
      >
        <div role="columnheader" className="col-span-6 text-slate-600">
          Form template
        </div>
        <div role="columnheader" className="col-span-2 text-slate-600"></div>
        <div role="columnheader" className="col-span-2 text-center text-slate-600">
          {/* TODO: Turn off for now */}
          {/* Default values */}
        </div>
        <div role="columnheader" className="col-span-2 text-center text-slate-600">
          Auto-sign
        </div>
      </div>
      <Card className="p-1">
        {/* Rows */}
        <div className="space-y-2">
          {rows.length === 0 ? (
            <div className="text-muted-foreground p-4 text-sm">No form templates available.</div>
          ) : (
            forms.map((r, i) => {
              return r.isLoading ? (
                <div key={r.name} className="border-b p-3">
                  <div className="grid grid-cols-12 items-center gap-3">
                    {/* Form name skeleton */}
                    <div className="col-span-6 space-y-2">
                      <div className="h-5 w-32 animate-pulse rounded bg-gray-300"></div>
                      <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
                    </div>
                    <div className="col-span-2"></div>
                    {/* Default values skeleton */}
                    <div className="col-span-2 flex justify-center">
                      <div className="h-9 w-40 animate-pulse rounded bg-gray-200"></div>
                    </div>
                    {/* Auto-sign skeleton */}
                    <div className="col-span-2 flex justify-center">
                      <div className="h-9 w-20 animate-pulse rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <MyFormRow
                  key={r.name}
                  row={r}
                  index={i}
                  onPreview={() => onPreview(r.name)}
                  onOpenAutoSignForm={() => onOpenAutoSignForm(r.name, r.party, r.enabledAutosign)}
                  toggleAutoSign={() => toggleAutoSign(r.name, r.party, r.enabledAutosign)}
                  loading={togglingName === r.name}
                  isCoordinator={isCoordinator}
                />
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
