"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Check, X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ISignatoryFormSettings,
  useFormSettings,
} from "@/app/docs/auth/provider/form-settings.ctx";

export type FormItem = { name: string; enabledAutosign: boolean; party: string; date: string };

export default function MyFormRow({
  row,
  onPreview,
  onOpenAutoSignForm,
  index,
  isCoordinator,
}: {
  row: FormItem;
  onPreview: () => void;
  onOpenAutoSignForm: () => void;
  index?: number;
  isCoordinator?: boolean;
}) {
  const [settings, setSettings] = useState<ISignatoryFormSettings>({});
  const [loading, setLoading] = useState(true);
  const formSettings = useFormSettings();

  const updateFormSettings = useCallback(
    (settings: Partial<ISignatoryFormSettings>) => {
      console.log("updating...", settings);
      setLoading(true);
      void formSettings
        .updateFormSettings(row.name, {
          autosign: settings.autosign,
        })
        .then(() => formSettings.getFormSettings(row.name))
        .then((r) => setSettings(r))
        .then(() => setLoading(false));
    },
    [formSettings, row.name, loading]
  );

  useEffect(() => {
    if (!loading) return;
    void formSettings
      .getFormSettings(row.name)
      .then((r) => {
        console.log("response", r);
        setSettings(r);
      })
      .then(() => setLoading(false));
  }, [formSettings, row.name]);

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
        {/* TODO: Bring back later on */}
        {/* <div className="flex flex-row space-x-2">
          {isCoordinator && (
            <Button size="sm" onClick={() => onPreview()}>
              <Eye className="mr-1.5 h-4 w-4" />
              Preview Forms
            </Button>
          )}
        </div> */}
      </div>
      <div role="cell" className="col-span-2"></div>

      {/* TODO: Hide for now */}
      {/* Form values (eye) */}
      <div role="cell" className="col-span-2 flex items-center justify-center">
        {/* <Button variant="outline" onClick={onOpenAutoSignForm}>
          My Default Values <Eye className="h-3 w-3 text-slate-700" />
        </Button> */}
      </div>

      {/* Auto-sign toggle */}
      <div role="cell" className="col-span-2 flex flex-col items-center justify-center gap-1">
        <Button
          onClick={() => updateFormSettings({ autosign: !settings.autosign })}
          disabled={!!loading}
          className={
            settings.autosign ? "bg-supportive text-white" : "bg-muted-foreground text-white"
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{settings.autosign ? "On" : "Off"}</span>
            {loading ? (
              <Loader className="animate-spin" />
            ) : settings.autosign ? (
              <Check className="mt-0.5 h-4 w-4 text-white" />
            ) : (
              <X className="mt-0.5 h-4 w-4 text-white" />
            )}
          </div>
        </Button>
      </div>
    </div>
  );
}
