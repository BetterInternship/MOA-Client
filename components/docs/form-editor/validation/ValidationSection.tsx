"use client";

import { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { ValidatorIRv0 } from "@/lib/validator-ir";
import { useValidationModel } from "@/hooks/useValidationModel";
import { buildValidatorSummary } from "@/components/docs/form-editor/validation/validator-summary";
import {
  ValidatorGroups,
  type ValidationFieldOption,
} from "@/components/docs/form-editor/validation/ValidatorGroups";
import { ValidatorStateBanner } from "@/components/docs/form-editor/validation/ValidatorStateBanner";

export interface ValidationSectionProps {
  title?: string;
  schemaType?: string;
  validator: string;
  validatorIr?: ValidatorIRv0 | null;
  fieldOptions?: ValidationFieldOption[];
  onChange: (next: { validator: string; validator_ir: ValidatorIRv0 | null }) => void;
}

/**
 * Raw Zod editor used when users switch from no-code toggles to code mode.
 * Any change here is treated as source-of-truth Zod and clears `validator_ir`.
 */
export function ValidationRawEditor({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  return (
    <div className="space-y-1">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='z.preprocess((v) => ((v ?? null) == null ? "" : (typeof v === "string" ? v.trim() : v)), z.string())'
        className="min-h-24 font-mono text-xs"
      />
      <p className="text-xs text-slate-500">Raw Zod expression</p>
    </div>
  );
}

/**
 * Top-level validation section shown in field editors.
 * Keeps host API stable while delegating mode/state behavior to `useValidationModel`.
 */
export function ValidationSection({
  title = "Validation",
  schemaType,
  validator,
  validatorIr,
  fieldOptions = [],
  onChange,
}: ValidationSectionProps) {
  const {
    baseType,
    mode,
    setMode,
    config,
    importState,
    isReadOnlyLegacy,
    onConfigChange,
    onRawChange,
    replaceWithSimpleRules,
  } = useValidationModel({
    schemaType,
    validator,
    validatorIr,
    onChange,
  });

  const summary = useMemo(() => buildValidatorSummary(config, baseType), [config, baseType]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs text-slate-600">{title}</h4>
        <button
          type="button"
          onClick={() => setMode((prev) => (prev === "raw" ? "simple" : "raw"))}
          className={`rounded-[0.33em] border px-2 py-0.5 text-xs ${
            mode === "raw"
              ? "border-slate-400 bg-slate-100 text-slate-800"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          title={mode === "raw" ? "Back to no-code" : "Edit raw validator"}
        >
          {"<>"}
        </button>
      </div>

      <ValidatorStateBanner
        importState={importState}
        mode={mode}
        onSwitchRaw={() => setMode("raw")}
        onReplace={replaceWithSimpleRules}
      />

      {mode === "simple" ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{summary}</p>
          <ValidatorGroups
            baseType={baseType}
            config={config}
            readOnly={isReadOnlyLegacy}
            fieldOptions={fieldOptions}
            onConfigChange={onConfigChange}
          />
        </div>
      ) : (
        <ValidationRawEditor value={validator || ""} onChange={onRawChange} />
      )}
    </div>
  );
}
