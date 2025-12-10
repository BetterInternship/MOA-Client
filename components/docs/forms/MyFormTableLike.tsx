"use client";

import React from "react";
import MyFormRow, { FormItem } from "../MyFormRow";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getFormFields } from "@/app/api/forms.api";
import { Loader2 } from "lucide-react";

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
          Default values
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
            forms.map((r, i) =>
              r.isLoading ? (
                <div className="border-b p-2">
                  <Loader2>Alright</Loader2>
                </div>
              ) : (
                <MyFormRow
                  key={r.name}
                  parties={
                    r.data?.formMetadata.required_parties
                      ?.map((f) => (f?.party ?? "") as string)
                      ?.filter((p) => !!p.trim()) ?? []
                  }
                  row={r}
                  index={i}
                  onPreview={() => onPreview(r.name)}
                  onOpenAutoSignForm={() => onOpenAutoSignForm(r.name, r.party, r.enabledAutosign)}
                  toggleAutoSign={() => toggleAutoSign(r.name, r.party, r.enabledAutosign)}
                  loading={togglingName === r.name}
                  isCoordinator={isCoordinator}
                />
              )
            )
          )}
        </div>
      </Card>
    </div>
  );
}
