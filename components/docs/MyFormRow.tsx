"use client";

import React from "react";
import { Eye, Check, Info, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/providers/modal-provider";

export type FormItem = { name: string; enabledAutosign: boolean; party: string };

export default function MyFormRow({
  row,
  onPreview,
  onOpenAutoSignForm,
  toggleAutoSign,
  index,
}: {
  row: FormItem;
  onPreview: () => void;
  onOpenAutoSignForm: () => void;
  toggleAutoSign: () => void;
  index?: number;
}) {
  return (
    <div
      role="row"
      aria-rowindex={index ? index + 2 : undefined}
      className="group grid grid-cols-12 items-center gap-3 p-3"
      tabIndex={0}
    >
      {/* Name */}
      <div role="cell" className="col-span-6 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{row.name}</div>
        </div>
      </div>

      {/* Preview */}
      <div role="cell" className="col-span-2 min-w-0">
        <Button size="sm" variant="outline" onClick={onPreview} aria-label={`Preview ${row.name}`}>
          Preview
          <ChevronRight className="mt-0.5 ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Form values (eye) */}
      <div role="cell" className="col-span-2 flex items-center justify-center">
        <Button variant="ghost" size="icon" onClick={onOpenAutoSignForm}>
          <Eye className="text-slate-700" />
        </Button>
      </div>

      {/* Auto-sign toggle */}
      <div role="cell" className="col-span-2 flex flex-col items-center justify-center gap-1">
        <Button
          onClick={toggleAutoSign}
          className={
            row.enabledAutosign ? "bg-emerald-600 text-white" : "bg-muted-foreground text-white"
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.enabledAutosign ? "On" : "Off"}</span>
            {row.enabledAutosign ? (
              <Check className="mt-0.5 h-4 w-4 text-white" />
            ) : (
              <X className="mt-0.5 h-4 w-4 text-white" />
            )}
          </div>
        </Button>

        {/* show date only when enabled (remove condition if you always want to display) */}
        {row.enabledAutosign ? (
          <div className="text-muted-foreground text-center text-[11px]">
            authorized: <span className="font-medium">11/12/2025</span>
          </div>
        ) : (
          <div className="text-muted-foreground text-center text-[11px] opacity-40">
            not authorized
          </div>
        )}
      </div>
    </div>
  );
}
