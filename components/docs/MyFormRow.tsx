"use client";

import React from "react";
import { Eye, Check, X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FormItem = {
  name: string;
  label: string;
  enabledAutosign: boolean;
  party: string;
  date: string;
};

export default function MyFormRow({
  row,
  onOpenAutoSignForm,
  toggleAutoSign,
  loading,
  index,
}: {
  row: FormItem;
  onOpenAutoSignForm: () => void;
  toggleAutoSign: () => void;
  loading?: boolean;
  index?: number;
}) {
  return (
    <div
      role="row"
      aria-rowindex={index ? index + 2 : undefined}
      className="group rounded-0 grid grid-cols-12 items-center gap-3 p-3"
      tabIndex={0}
    >
      {/* Name */}
      <div role="cell" className="col-span-6 min-w-0 items-center space-y-2">
        <div className="text-md truncate font-medium">{row.label}</div>
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
            row.enabledAutosign ? "bg-supportive text-white" : "bg-muted-foreground text-white"
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.enabledAutosign ? "On" : "Off"}</span>
            {loading ? (
              <Loader className="animate-spin" />
            ) : row.enabledAutosign ? (
              <Check className="mt-0.5 h-4 w-4 text-white" />
            ) : (
              <X className="mt-0.5 h-4 w-4 text-white" />
            )}
          </div>
        </Button>
        {row.date && row.enabledAutosign && (
          <p className="text-xs text-gray-500">
            <span className="font-medium">Enabled:</span> {new Date(row.date).toLocaleDateString()}{" "}
            {new Date(row.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
