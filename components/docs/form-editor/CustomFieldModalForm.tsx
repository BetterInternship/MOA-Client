"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { SOURCES } from "@betterinternship/core/forms";
import { deriveFieldNameFromLabel } from "@/lib/field-name";
import { BlocksRenderer } from "@/components/docs/forms/FormFillerRenderer";
import { useCustomFieldPreview } from "@/components/docs/form-editor/UseCustomFieldPreview";
import { FieldSource } from "@/lib/custom-field-mappers";
import { type ValidatorIRv0 } from "@/lib/validator-ir";
import { getPresetFieldIcon } from "@/lib/preset-field-icons";
import { ValidationSection } from "@/components/docs/form-editor/validation.bundle";
import { DefaultValueSection } from "@/components/docs/form-editor/default-value.bundle";

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
}

export interface CustomFieldFormOption {
  id: string;
  name: string;
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
  showDerivedNameHint?: boolean;
  presetTemplates?: CustomFieldPresetOption[];
  selectedPresetId?: string;
  onPresetChange?: (presetId: string) => void;
  tagOptions?: string[];
}

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
  const corePresetTemplates = (presetTemplates || []).filter(
    (preset) => (preset.group || "core") === "core"
  );
  const formatPresetTemplates = (presetTemplates || []).filter((preset) => preset.group === "format");
  const hasPresetGroups = formatPresetTemplates.length > 0;
  const selectedPreset = (presetTemplates || []).find((preset) => preset.id === selectedPresetId);
  const SelectedPresetIcon = selectedPreset
    ? getPresetFieldIcon(selectedPreset.iconKey, selectedPreset.name)
    : null;

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
            <SelectContent>
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
                    <SelectItem key={preset.id} value={preset.id} disabled={Boolean(preset.disabled)}>
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
          </div>

          <DefaultValueSection
            source={value.source}
            value={value.prefiller || ""}
            fieldOptions={fieldOptions}
            onChange={(next) => onChange({ prefiller: next })}
          />

          <ValidationSection
            schemaType={value.type}
            validator={value.validator || ""}
            validatorIr={value.validator_ir || null}
            onChange={(next) => onChange(next)}
          />
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
