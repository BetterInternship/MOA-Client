"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { SOURCES } from "@betterinternship/core/forms";
import {
  buildFieldRefPrefiller,
  buildManualPrefiller,
  parsePrefillerToCompactState,
} from "@/lib/default-value-builder";
import { validateExpression } from "@/lib/expression-validator";
import { ValidatorBuilder } from "@/components/docs/form-editor/ValidatorBuilder";
import { validatorConfigToZodCode, zodCodeToValidatorConfig } from "@/lib/validator-engine";
import { deriveFieldNameFromLabel } from "@/lib/field-name";
import { BlocksRenderer } from "@/components/docs/forms/FormFillerRenderer";
import { useCustomFieldPreview } from "@/components/docs/form-editor/UseCustomFieldPreview";
import { FieldSource } from "@/lib/custom-field-mappers";

export interface CustomFieldModalFormValue {
  name: string;
  label: string;
  tag: string;
  tooltip_label: string;
  type: string;
  source: FieldSource;
  shared: boolean;
  prefiller: string;
  validator: string;
}

export interface CustomFieldFormOption {
  id: string;
  name: string;
}

export interface CustomFieldPresetOption {
  id: string;
  name: string;
  label?: string;
}

interface CustomFieldModalFormProps {
  value: CustomFieldModalFormValue;
  fieldOptions: CustomFieldFormOption[];
  onChange: (updates: Partial<CustomFieldModalFormValue>) => void;
  onLabelChange?: (label: string) => void;
  tagReadOnly?: boolean;
  showDerivedNameHint?: boolean;
  presetTemplates?: CustomFieldPresetOption[];
  selectedPresetId?: string;
  onPresetChange?: (presetId: string) => void;
  tagOptions?: string[];
}

const normalizeValidatorCode = (value: string) =>
  (value || "").replace(/\s+/g, "").replace(/;$/, "").trim();

export function CustomFieldModalForm({
  value,
  fieldOptions,
  onChange,
  onLabelChange,
  tagReadOnly = false,
  showDerivedNameHint = false,
  presetTemplates,
  selectedPresetId = "",
  onPresetChange,
  tagOptions = [],
}: CustomFieldModalFormProps) {
  const [defaultMode, setDefaultMode] = useState<"simple" | "raw">("simple");
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [manualDefaultValue, setManualDefaultValue] = useState("");

  const parsedValidatorConfig = useMemo(
    () => zodCodeToValidatorConfig(value.validator || ""),
    [value.validator]
  );
  const isBuilderCompatible = useMemo(() => {
    const current = value.validator || "";
    if (!current.trim()) return true;
    const rebuilt = validatorConfigToZodCode(parsedValidatorConfig);
    return normalizeValidatorCode(rebuilt) === normalizeValidatorCode(current);
  }, [parsedValidatorConfig, value.validator]);

  const defaultParsed = useMemo(
    () => parsePrefillerToCompactState(value.prefiller || ""),
    [value.prefiller]
  );
  const prefillerValidation = validateExpression(value.prefiller || "");

  useEffect(() => {
    if (defaultParsed.kind === "manual") setManualDefaultValue(defaultParsed.manualValue);
    if (defaultParsed.kind === "empty") setManualDefaultValue("");
  }, [defaultParsed.kind, defaultParsed.manualValue]);

  const {
    previewBlocks,
    previewValues,
    previewErrors,
    previewFieldRefs,
    onValueChange,
    onBlurValidate,
  } = useCustomFieldPreview(
    {
      name: value.name,
      label: value.label,
      tooltip_label: value.tooltip_label,
      type: value.type,
      source: value.source,
      shared: value.shared,
      prefiller: value.prefiller,
      validator: value.validator,
    },
    selectedPresetId
  );

  return (
    <div className="space-y-4">
      {presetTemplates && onPresetChange && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Preset template</Label>
          <select
            value={selectedPresetId}
            onChange={(e) => onPresetChange(e.target.value)}
            className="h-9 w-full rounded-[0.33em] border border-slate-300 bg-white px-2.5 text-sm"
          >
            <option value="">Select a preset</option>
            {presetTemplates.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label || preset.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {!presetTemplates || selectedPresetId ? (
        <>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Label</Label>
          <Input
            value={value.label}
            onChange={(e) => {
              const nextLabel = e.target.value;
              if (onLabelChange) {
                onLabelChange(nextLabel);
              } else {
                onChange({ label: nextLabel, name: deriveFieldNameFromLabel(nextLabel) });
              }
            }}
            placeholder="Field Label"
          />
          {showDerivedNameHint && (
            <p className="text-[11px] text-slate-500">
              {value.name || deriveFieldNameFromLabel(value.label) || "(empty)"}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Tooltip Label</Label>
          <Textarea
            value={value.tooltip_label}
            onChange={(e) => onChange({ tooltip_label: e.target.value })}
            placeholder="Tooltip text"
            className="min-h-20 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Source</Label>
            <Autocomplete
              value={value.source}
              inputClassName="h-9 text-sm"
              placeholder={SOURCES.join(", ")}
              options={SOURCES.map((s) => ({ id: s, name: s }))}
              setter={(id) =>
                id && onChange({ source: id as CustomFieldModalFormValue["source"] })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Tag/Category</Label>
            {tagReadOnly ? (
              <Input value={value.tag} readOnly placeholder="uncategorized" className="h-9 text-sm" />
            ) : (
              <Autocomplete
                value={value.tag}
                inputClassName="h-9 text-sm"
                options={tagOptions.map((tag) => ({ id: tag, name: tag }))}
                setter={(nextTag) => onChange({ tag: String(nextTag || "") })}
                placeholder="uncategorized"
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold text-slate-700">Default value</Label>
          <button
            type="button"
            onClick={() => setDefaultMode((prev) => (prev === "raw" ? "simple" : "raw"))}
            className="rounded-[0.33em] px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title={defaultMode === "raw" ? "Back to simple mode" : "Open raw mode"}
          >
            {defaultMode === "raw" ? "Back" : "<>"}
          </button>
        </div>
        {defaultMode === "simple" ? (
          <DropdownMenu open={defaultOpen} onOpenChange={setDefaultOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-full items-center justify-between rounded-[0.33em] border border-slate-300 bg-white px-2.5 text-sm text-slate-700"
              >
                <span className="truncate">
                  {defaultParsed.kind === "field"
                    ? fieldOptions.find((f) => f.id === defaultParsed.fieldRef)?.name || defaultParsed.fieldRef
                    : defaultParsed.kind === "manual"
                      ? defaultParsed.manualValue || "Manual"
                      : defaultParsed.kind === "custom"
                        ? "Custom"
                        : "Select"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="bottom"
              sideOffset={6}
              onWheelCapture={(e) => e.stopPropagation()}
              className="z-[1200] w-[var(--radix-dropdown-menu-trigger-width)] rounded-[0.33em] p-2"
            >
              <div
                className="max-h-44 space-y-1 overflow-y-auto overscroll-contain pr-0.5"
                onWheelCapture={(e) => e.stopPropagation()}
              >
                {fieldOptions.map((field) => (
                  <DropdownMenuItem
                    key={field.id}
                    onClick={() => onChange({ prefiller: buildFieldRefPrefiller(field.id) })}
                    className="text-sm"
                  >
                    {field.name}
                  </DropdownMenuItem>
                ))}
              </div>
              <div className="my-2 h-px bg-slate-200" />
              <div className="space-y-1">
                <p className="text-xs text-slate-600">Manual value</p>
                <Input
                  value={manualDefaultValue}
                  onChange={(e) => setManualDefaultValue(e.target.value)}
                  onBlur={() => onChange({ prefiller: buildManualPrefiller(manualDefaultValue) })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChange({ prefiller: buildManualPrefiller(manualDefaultValue) });
                      setDefaultOpen(false);
                    }
                  }}
                  placeholder="Type value"
                  className="h-8 text-sm"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-y-1">
            <Textarea
              value={value.prefiller || ""}
              onChange={(e) => onChange({ prefiller: e.target.value })}
              placeholder='() => "Sample Value"'
              className="min-h-20 font-mono text-xs"
            />
            {!prefillerValidation.valid && <p className="text-xs text-red-600">{prefillerValidation.message}</p>}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold text-slate-700">Validation</Label>
        <ValidatorBuilder
          config={parsedValidatorConfig}
          rawZodCode={value.validator || ""}
          onConfigChange={(newConfig) =>
            onChange({
              validator: isBuilderCompatible ? validatorConfigToZodCode(newConfig) : value.validator || "",
            })
          }
          onRawZodChange={(code) => onChange({ validator: code })}
          emitRawOnChange={true}
          compact={true}
          hideGeneratedPreview={true}
        />
      </div>
      <div className="rounded-[0.33em] border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold text-slate-700">Field Preview</p>
        <div className="rounded-[0.33em] border border-slate-300 bg-white p-2">
          <BlocksRenderer
            formKey="custom-field-preview"
            blocks={previewBlocks}
            values={previewValues}
            onChange={onValueChange}
            errors={previewErrors}
            setSelected={() => {}}
            onBlurValidate={onBlurValidate}
            fieldRefs={previewFieldRefs.current}
          />
        </div>
      </div>
        </>
      ) : null}
    </div>
  );
}
