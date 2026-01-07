"use client";

import React from "react";
import { Eye, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWhen } from "@/lib/format";

export type FormItem = { name: string; enabledAutosign: boolean; party: string; date: string };

export default function MyFormRow({
  row,
  parties,
  onPreview,
  onOpenAutoSignForm,
  toggleAutoSign,
  index,
  loading,
  isCoordinator,
}: {
  row: FormItem;
  parties: string[];
  onPreview: (party: string) => void;
  onOpenAutoSignForm: () => void;
  toggleAutoSign: () => void;
  index?: number;
  loading?: boolean;
  isCoordinator?: boolean;
}) {
  const date = formatWhen(row.date ?? "", "mmddyyyy");
  return (
    <div
      role="row"
      aria-rowindex={index ? index + 2 : undefined}
      className="group rounded-0 grid grid-cols-12 items-center gap-3 border-b p-3"
      tabIndex={0}
    >
      {/* Name */}
      <div role="cell" className="col-span-6 min-w-0 items-center space-y-2">
        <div className="min-w-0 flex-1">
          <div className="text-md truncate font-medium">{row.name}</div>
        </div>
        <div className="flex flex-row space-x-2">
          {isCoordinator &&
            parties &&
            parties.map((p) => (
              <Button
                key={p}
                size="sm"
                onClick={() => onPreview(p)}
                aria-label={`Preview ${row.name} as ${p}`}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                Preview Forms
              </Button>
            ))}
        </div>
      </div>
      <div role="cell" className="col-span-2"></div>

      {/* Form values (eye) */}
      <div role="cell" className="col-span-2 flex items-center justify-center">
        <Button variant="outline" onClick={onOpenAutoSignForm}>
          My Default Values <Eye className="h-3 w-3 text-slate-700" />
        </Button>
      </div>

      {/* Auto-sign toggle */}
      <div role="cell" className="col-span-2 flex flex-col items-center justify-center gap-1">
        <Button
          onClick={toggleAutoSign}
          disabled={!!loading}
          className={
            row.enabledAutosign ? "bg-emerald-600 text-white" : "bg-muted-foreground text-white"
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.enabledAutosign ? "On" : "Off"}</span>
            {loading ? (
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : row.enabledAutosign ? (
              <Check className="mt-0.5 h-4 w-4 text-white" />
            ) : (
              <X className="mt-0.5 h-4 w-4 text-white" />
            )}
          </div>
        </Button>

        {/* show date only when enabled */}
        {row.enabledAutosign ? (
          <div className="text-muted-foreground text-center text-[11px]">
            authorized: <span className="font-medium">{date ?? "-"}</span>
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
