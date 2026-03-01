import {
  getFieldPresetTemplates,
  type FieldPresetTemplate,
} from "@betterinternship/core/forms";
import type { ValidatorIRv0 } from "@/lib/validator-ir";
import { normalizePresetTemplate } from "@/lib/default-field-preset-utils";
import { sanitizeFieldSchemaDefaults, type FieldSchemaDefaults } from "@/lib/field-schema-defaults";

type RegistryPresetLike = {
  name?: string | null;
  label?: string | null;
  type?: string | null;
  source?: string | null;
  shared?: boolean | null;
  tag?: string | null;
  preset?: string | null;
  prefiller?: string | null;
  tooltip_label?: string | null;
  validator?: string | null;
  validator_ir?: ValidatorIRv0 | null;
  is_phantom?: boolean | null;
  party?: string | null;
  field_schema_defaults?: unknown;
};

export type ResolvedSystemPresetTemplate = FieldPresetTemplate & {
  field_schema_defaults?: FieldSchemaDefaults;
};

const normalizeKey = (value: string | null | undefined) => String(value || "").trim().toLowerCase();

const isSystemPresetRow = (entry: RegistryPresetLike) =>
  normalizeKey(entry.tag) === "preset" || normalizeKey(entry.preset) === "system";

const toPresetType = (value: string | null | undefined, fallback: FieldPresetTemplate["type"]) => {
  if (value === "text" || value === "signature" || value === "image") return value;
  return fallback;
};

const toPresetSource = (
  value: string | null | undefined,
  fallback: FieldPresetTemplate["source"]
): FieldPresetTemplate["source"] => {
  if (value === "auto" || value === "prefill" || value === "derived" || value === "manual") {
    return value;
  }
  return fallback;
};

export const resolveSystemPresetTemplates = (
  registryRows: RegistryPresetLike[]
): ResolvedSystemPresetTemplate[] => {
  const packagePresets = getFieldPresetTemplates().map((preset) => normalizePresetTemplate(preset));
  const systemRowsByName = new Map<string, RegistryPresetLike>();

  for (const row of registryRows) {
    if (!isSystemPresetRow(row)) continue;
    const key = normalizeKey(row.name);
    if (!key) continue;
    systemRowsByName.set(key, row);
  }

  return packagePresets.map((preset) => {
    const systemRow = systemRowsByName.get(normalizeKey(preset.name));
    const defaults = sanitizeFieldSchemaDefaults(systemRow?.field_schema_defaults);
    const packageDefaults = sanitizeFieldSchemaDefaults(
      (preset as unknown as { field_schema_defaults?: unknown }).field_schema_defaults
    );

    const mergedPreset = normalizePresetTemplate({
      ...preset,
      label: systemRow?.label || preset.label,
      type: toPresetType(systemRow?.type, preset.type),
      source: toPresetSource(systemRow?.source, preset.source),
      shared: typeof systemRow?.shared === "boolean" ? systemRow.shared : preset.shared,
      tag: systemRow?.tag || preset.tag,
      preset: systemRow?.preset || preset.preset || "default",
      prefiller: systemRow?.prefiller ?? preset.prefiller,
      tooltip_label: systemRow?.tooltip_label ?? preset.tooltip_label,
      validator: systemRow?.validator ?? preset.validator,
      validator_ir: systemRow?.validator_ir ?? preset.validator_ir,
      is_phantom: typeof systemRow?.is_phantom === "boolean" ? systemRow.is_phantom : preset.is_phantom,
      party: systemRow?.party ?? preset.party,
    } as FieldPresetTemplate);

    return {
      ...mergedPreset,
      field_schema_defaults: defaults || packageDefaults,
    } as ResolvedSystemPresetTemplate;
  });
};
