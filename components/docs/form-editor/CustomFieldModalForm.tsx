"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { deriveFieldNameFromLabel } from "@/lib/field-name";
import { BlocksRenderer } from "@/components/docs/forms/FormFillerRenderer";
import { useCustomFieldPreview } from "@/components/docs/form-editor/UseCustomFieldPreview";
import { FieldSource } from "@/lib/custom-field-mappers";
import { type ValidatorIRv0 } from "@/lib/validator-ir";
import { getPresetFieldIcon } from "@/lib/preset-field-icons";
import { ValidationSection } from "@/components/docs/form-editor/validation.bundle";
import type { ValidationRuleId } from "@/components/docs/form-editor/validation/ValidatorGroups";
import { DefaultValueSection } from "@/components/docs/form-editor/default-value.bundle";
import type { FieldSchemaDefaults } from "@/lib/field-schema-defaults";
import {
  BiAlignLeft,
  BiAlignMiddle,
  BiAlignRight,
  BiVerticalBottom,
  BiVerticalCenter,
  BiVerticalTop,
} from "react-icons/bi";

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
  validator_ir?: ValidatorIRv0 | null;
  field_schema_defaults?: FieldSchemaDefaults | null;
}

export interface CustomFieldFormOption {
  id: string;
  name: string;
  type?: string;
  validator?: string;
  validator_ir?: ValidatorIRv0 | null;
}

export interface CustomFieldPresetOption {
  id: string;
  name: string;
  label?: string;
  group?: "core" | "format";
  iconKey?: string;
  disabled?: boolean;
}

interface CustomFieldModalFormProps {
  value: CustomFieldModalFormValue;
  fieldOptions: CustomFieldFormOption[];
  onChange: (updates: Partial<CustomFieldModalFormValue>) => void;
  onLabelChange?: (label: string) => void;
  tagReadOnly?: boolean;
  hideTagField?: boolean;
  allowedValidationRuleIds?: ValidationRuleId[];
  showDerivedNameHint?: boolean;
  presetTemplates?: CustomFieldPresetOption[];
  selectedPresetId?: string;
  onPresetChange?: (presetId: string) => void;
  tagOptions?: string[];
}

/**
 * Shared field create/edit form used by field registry modals.
 * Preset selection seeds defaults; users can still override every value before save.
 */
export function CustomFieldModalForm({
  value,
  fieldOptions,
  onChange,
  onLabelChange,
  tagReadOnly = false,
  hideTagField = false,
  allowedValidationRuleIds,
  showDerivedNameHint = false,
  presetTemplates,
  selectedPresetId = "",
  onPresetChange,
  tagOptions = [],
}: CustomFieldModalFormProps) {
  const isDerived = value.source === "derived";
  const isPrefill = value.source === "prefill";
  const isAuto = value.source === "auto";
  const showValidation = !isDerived && !isPrefill && !isAuto;
  const showPlaceholder = !isDerived && !isAuto;
  const corePresetTemplates = (presetTemplates || []).filter(
    (preset) => (preset.group || "core") === "core"
  );
  const formatPresetTemplates = (presetTemplates || []).filter(
    (preset) => preset.group === "format"
  );
  const hasPresetGroups = formatPresetTemplates.length > 0;
  const selectedPreset = (presetTemplates || []).find((preset) => preset.id === selectedPresetId);
  const SelectedPresetIcon = selectedPreset
    ? getPresetFieldIcon(selectedPreset.iconKey, selectedPreset.name)
    : null;
  const schemaDefaults = value.field_schema_defaults || {};
  const applyFieldSchemaDefaults = (updates: Partial<FieldSchemaDefaults>) => {
    const nextDefaults: FieldSchemaDefaults = {
      ...(value.field_schema_defaults || {}),
      ...updates,
    };

    if (typeof nextDefaults.w !== "number" || !Number.isFinite(nextDefaults.w) || nextDefaults.w <= 0) {
      delete nextDefaults.w;
    }
    if (typeof nextDefaults.h !== "number" || !Number.isFinite(nextDefaults.h) || nextDefaults.h <= 0) {
      delete nextDefaults.h;
    }
    if (typeof nextDefaults.size !== "number" || !Number.isFinite(nextDefaults.size)) {
      delete nextDefaults.size;
    }
    if (!nextDefaults.align_h) delete nextDefaults.align_h;
    if (!nextDefaults.align_v) delete nextDefaults.align_v;
    if (typeof nextDefaults.font !== "string" || nextDefaults.font.trim().length === 0) {
      delete nextDefaults.font;
    }
    if (typeof nextDefaults.wrap !== "boolean") delete nextDefaults.wrap;

    onChange({
      field_schema_defaults: Object.keys(nextDefaults).length > 0 ? nextDefaults : null,
    });
  };

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
          <Select
            value={selectedPresetId || "__none"}
            onValueChange={(nextValue) => onPresetChange(nextValue === "__none" ? "" : nextValue)}
          >
            <SelectTrigger className="h-9 text-sm">
              {selectedPreset ? (
                <div className="flex items-center gap-2">
                  {SelectedPresetIcon && <SelectedPresetIcon className="h-4 w-4 text-slate-500" />}
                  <span>{selectedPreset.label || selectedPreset.name}</span>
                </div>
              ) : (
                <SelectValue placeholder="Select a preset" />
              )}
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="__none">Select a preset</SelectItem>

              {hasPresetGroups ? (
                <>
                  <SelectGroup>
                    <SelectLabel>Core Fields</SelectLabel>
                    {corePresetTemplates.map((preset) => {
                      const Icon = getPresetFieldIcon(preset.iconKey, preset.name);
                      return (
                        <SelectItem
                          key={preset.id}
                          value={preset.id}
                          disabled={Boolean(preset.disabled)}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-slate-500" />
                            <span>{preset.label || preset.name}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Format Presets</SelectLabel>
                    {formatPresetTemplates.map((preset) => {
                      const Icon = getPresetFieldIcon(preset.iconKey, preset.name);
                      return (
                        <SelectItem
                          key={preset.id}
                          value={preset.id}
                          disabled={Boolean(preset.disabled)}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-slate-500" />
                            <span>{preset.label || preset.name}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </>
              ) : (
                presetTemplates.map((preset) => {
                  const Icon = getPresetFieldIcon(preset.iconKey, preset.name);
                  return (
                    <SelectItem
                      key={preset.id}
                      value={preset.id}
                      disabled={Boolean(preset.disabled)}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500" />
                        <span>{preset.label || preset.name}</span>
                      </span>
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
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
                  Field name:{" "}
                  <span className="font-semibold">
                    {value.name || deriveFieldNameFromLabel(value.label) || "(empty)"}
                  </span>
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

            {!hideTagField && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Tag/Category</Label>
                  {tagReadOnly ? (
                    <Input
                      value={value.tag}
                      readOnly
                      placeholder="uncategorized"
                      className="h-9 text-sm"
                    />
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
            )}

            <div className="space-y-2 rounded-[0.33em] border border-slate-200 p-2.5">
              <Label className="text-xs font-semibold text-slate-700">Default Render Style</Label>
              <div className="grid grid-cols-[1fr_110px] items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600">Text wrap</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={schemaDefaults.wrap !== false ? "default" : "outline"}
                      className="h-8 flex-1"
                      onClick={() => applyFieldSchemaDefaults({ wrap: true })}
                    >
                      Wrap
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={schemaDefaults.wrap !== false ? "outline" : "default"}
                      className="h-8 flex-1"
                      onClick={() => applyFieldSchemaDefaults({ wrap: false })}
                    >
                      No wrap
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600">Font size</Label>
                  <Input
                    type="number"
                    value={schemaDefaults.size ?? ""}
                    onChange={(e) =>
                      applyFieldSchemaDefaults({
                        size:
                          e.target.value.trim().length === 0 ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="12"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600">Width</Label>
                  <Input
                    type="number"
                    value={schemaDefaults.w ?? ""}
                    onChange={(e) =>
                      applyFieldSchemaDefaults({
                        w:
                          e.target.value.trim().length === 0 ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="100"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600">Height</Label>
                  <Input
                    type="number"
                    value={schemaDefaults.h ?? ""}
                    onChange={(e) =>
                      applyFieldSchemaDefaults({
                        h:
                          e.target.value.trim().length === 0 ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="12"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Horizontal</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={(schemaDefaults.align_h || "center") === "left" ? "default" : "outline"}
                    className="h-8 flex-1"
                    onClick={() => applyFieldSchemaDefaults({ align_h: "left" })}
                  >
                    <BiAlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={(schemaDefaults.align_h || "center") === "center" ? "default" : "outline"}
                    className="h-8 flex-1"
                    onClick={() => applyFieldSchemaDefaults({ align_h: "center" })}
                  >
                    <BiAlignMiddle className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={(schemaDefaults.align_h || "center") === "right" ? "default" : "outline"}
                    className="h-8 flex-1"
                    onClick={() => applyFieldSchemaDefaults({ align_h: "right" })}
                  >
                    <BiAlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Vertical</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={(schemaDefaults.align_v || "bottom") === "top" ? "default" : "outline"}
                    className="h-8 flex-1"
                    onClick={() => applyFieldSchemaDefaults({ align_v: "top" })}
                  >
                    <BiVerticalTop className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={(schemaDefaults.align_v || "bottom") === "middle" ? "default" : "outline"}
                    className="h-8 flex-1"
                    onClick={() => applyFieldSchemaDefaults({ align_v: "middle" })}
                  >
                    <BiVerticalCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={(schemaDefaults.align_v || "bottom") === "bottom" ? "default" : "outline"}
                    className="h-8 flex-1"
                    onClick={() => applyFieldSchemaDefaults({ align_v: "bottom" })}
                  >
                    <BiVerticalBottom className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Font (optional)</Label>
                <Input
                  value={schemaDefaults.font || ""}
                  onChange={(e) =>
                    applyFieldSchemaDefaults({
                      font: e.target.value as unknown as FieldSchemaDefaults["font"],
                    })
                  }
                  placeholder="e.g. Helvetica"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {isDerived ? (
            <>
              <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700">Derived value</p>
              
                </div>
                <Switch
                  checked={isDerived}
                  onCheckedChange={(checked) =>
                    onChange({ source: checked ? "derived" : "manual" })
                  }
                />
              </div>
              <DefaultValueSection
                title="Default Values"
                source={value.source}
                value={value.prefiller || ""}
                fieldOptions={fieldOptions}
                onChange={(next) => onChange({ prefiller: next })}
              />
            </>
          ) : (
            <>
              {showValidation && (
                <ValidationSection
                  schemaType={value.type}
                  validator={value.validator || ""}
                  validatorIr={value.validator_ir || null}
                  fieldOptions={fieldOptions}
                  currentFieldId={value.name}
                  allowedRuleIds={allowedValidationRuleIds}
                  onChange={(next) => onChange(next)}
                />
              )}
              {showPlaceholder && (
                <div className="mt-4">
                  <DefaultValueSection
                    title="Placeholder"
                    source={value.source}
                    value={value.prefiller || ""}
                    fieldOptions={fieldOptions}
                    simpleMode="manual-only"
                    onChange={(next) => onChange({ prefiller: next })}
                  />
                </div>
              )}
              <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700">Derived value</p>
                </div>
                <Switch
                  checked={isDerived}
                  onCheckedChange={(checked) =>
                    onChange({ source: checked ? "derived" : "manual" })
                  }
                />
              </div>
            </>
          )}
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
