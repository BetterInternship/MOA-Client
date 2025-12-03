"use client";

import React from "react";
import MyFormRow, { FormItem } from "../MyFormRow";
import { Card } from "@/components/ui/card";

export default function MyFormsTableLike({
  rows,
  onPreview,
  onOpenAutoSignForm,
  toggleAutoSign,
}: {
  rows: FormItem[];
  onPreview: (name: string) => void;
  onOpenAutoSignForm: (name: string, party: string, currentValue: boolean) => void;
  toggleAutoSign: (name: string, party: string, currentValue: boolean) => void;
}) {
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
            rows.map((r, i) => (
              <MyFormRow
                key={r.name}
                row={r}
                index={i}
                onPreview={() => onPreview(r.name)}
                onOpenAutoSignForm={() => onOpenAutoSignForm(r.name, r.party, r.enabledAutosign)}
                toggleAutoSign={() => toggleAutoSign(r.name, r.party, r.enabledAutosign)}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
