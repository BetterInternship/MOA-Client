import {
  getFieldPresetTemplates,
  type FieldPresetTemplate,
} from "@betterinternship/core/forms";
import { validateValidatorIR, type ValidatorIRv0 } from "@/lib/validator-ir";
import { normalizePresetTemplate } from "@/lib/default-field-preset-utils";
import { sanitizeFieldSchemaDefaults, type FieldSchemaDefaults } from "@/lib/field-schema-defaults";

type RegistryPresetLike = {
  id?: string | null;
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

const sanitizeValidatorIr = (value: unknown): ValidatorIRv0 | null => {
  if (value == null) return null;

  let candidate: unknown = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  const parsed = validateValidatorIR(candidate);
  if (!parsed.ok) return null;
  return candidate as ValidatorIRv0;
};

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
  const packagePresetByName = new Map<string, FieldPresetTemplate>();
  for (const preset of packagePresets) {
    packagePresetByName.set(normalizeKey(preset.name), preset);
  }

  const systemRows = registryRows.filter(isSystemPresetRow);
  const resolvedFromDb: ResolvedSystemPresetTemplate[] = systemRows
    .map((row) => {
      const rowName = normalizeKey(row.name);
      if (!rowName) return null;

      const packagePreset = packagePresetByName.get(rowName);
      const packageValidatorIr = sanitizeValidatorIr(packagePreset?.validator_ir);
      const rowValidatorIr = sanitizeValidatorIr(row.validator_ir);
      const packageDefaults = sanitizeFieldSchemaDefaults(
        (packagePreset as unknown as { field_schema_defaults?: unknown } | undefined)
          ?.field_schema_defaults
      );
      const rowDefaults = sanitizeFieldSchemaDefaults(row.field_schema_defaults);

      const mergedPreset = normalizePresetTemplate({
        ...(packagePreset || {
          id: row.id || `preset-${rowName}`,
          name: row.name || rowName,
          label: row.label || row.name || rowName,
          type: "text",
          source: "manual",
          shared: true,
          tag: "preset",
          preset: "system",
          prefiller: "",
          tooltip_label: "",
          validator: "",
          validator_ir: null,
          is_phantom: false,
        }),
        label: row.label || packagePreset?.label,
        type: toPresetType(row.type, packagePreset?.type || "text"),
        source: toPresetSource(row.source, packagePreset?.source || "manual"),
        shared: typeof row.shared === "boolean" ? row.shared : (packagePreset?.shared ?? true),
        tag: row.tag || packagePreset?.tag,
        preset: row.preset || packagePreset?.preset || "system",
        prefiller: row.prefiller ?? packagePreset?.prefiller,
        tooltip_label: row.tooltip_label ?? packagePreset?.tooltip_label,
        validator: row.validator ?? packagePreset?.validator,
        validator_ir: rowValidatorIr ?? packageValidatorIr,
        is_phantom:
          typeof row.is_phantom === "boolean" ? row.is_phantom : (packagePreset?.is_phantom ?? false),
        party: row.party ?? packagePreset?.party,
      } as FieldPresetTemplate);

      return {
        ...mergedPreset,
        field_schema_defaults: rowDefaults || packageDefaults,
      } as ResolvedSystemPresetTemplate;
    })
    .filter((preset): preset is ResolvedSystemPresetTemplate => Boolean(preset));

  // Keep package fallback rows for any system presets missing in DB.
  const resolvedNames = new Set(resolvedFromDb.map((preset) => normalizeKey(preset.name)));
  const fallbackFromPackage = packagePresets
    .filter((preset) => !resolvedNames.has(normalizeKey(preset.name)))
    .map((preset) => {
      const packageDefaults = sanitizeFieldSchemaDefaults(
        (preset as unknown as { field_schema_defaults?: unknown }).field_schema_defaults
      );
      return {
        ...preset,
        field_schema_defaults: packageDefaults,
      } as ResolvedSystemPresetTemplate;
    });

  return [...resolvedFromDb, ...fallbackFromPackage];
};
