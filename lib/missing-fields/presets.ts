import type { IFormBlock, IFormField } from "@betterinternship/core/forms";
import type { ResolvedSystemPresetTemplate } from "@/lib/system-preset-resolver";
import { sanitizeFieldSchemaDefaults } from "@/lib/field-schema-defaults";
import type { MissingFieldSuggestion } from "@/lib/missing-fields/types";
import { persistedIRToZod, validatorConfigToPersistedIR } from "@/lib/validator-ir";

const createUniqueFieldKey = (base: string) =>
  `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalize = (value: string) => value.toLowerCase().replace(/[_\s-]+/g, "").trim();

const findPresetByNames = (
  presets: ResolvedSystemPresetTemplate[],
  names: string[]
): ResolvedSystemPresetTemplate | null => {
  const normalizedNames = new Set(names.map((name) => normalize(name)));
  return (
    presets.find(
      (preset) => normalizedNames.has(normalize(preset.name)) || normalizedNames.has(normalize(preset.label))
    ) || null
  );
};

export const buildDateValidatorPayload = () => {
  const validatorIr = validatorConfigToPersistedIR(
    {
      rules: [{ id: "date-rule", type: "date", params: {} }],
    },
    "date"
  );

  return {
    validator_ir: validatorIr,
    validator: persistedIRToZod(validatorIr),
  };
};

export function resolveSuggestionPreset(
  suggestion: MissingFieldSuggestion,
  registryPresets: ResolvedSystemPresetTemplate[]
) {
  const nearby = `${suggestion.inferredLabel} ${suggestion.nearbyText}`.toLowerCase();
  const shortTextPreset = findPresetByNames(registryPresets, ["short_text", "short text"]);

  if (suggestion.inferredKind === "signature") {
    return {
      preset:
        findPresetByNames(registryPresets, ["signature", "sign"]) ||
        shortTextPreset ||
        registryPresets[0] ||
        null,
      useDateFallback: false,
    };
  }

  if (suggestion.inferredKind === "date") {
    const datePreset = findPresetByNames(registryPresets, ["date"]);
    return {
      preset: datePreset || shortTextPreset || registryPresets[0] || null,
      useDateFallback: !datePreset,
    };
  }

  if (/\bemail\b/.test(nearby)) {
    return {
      preset:
        findPresetByNames(registryPresets, ["email"]) ||
        shortTextPreset ||
        registryPresets[0] ||
        null,
      useDateFallback: false,
    };
  }

  if (/\bphone\b|\bmobile\b|\bcontact\b/.test(nearby)) {
    return {
      preset:
        findPresetByNames(registryPresets, ["phone_number", "phone", "mobile"]) ||
        shortTextPreset ||
        registryPresets[0] ||
        null,
      useDateFallback: false,
    };
  }

  if (/\bname\b/.test(nearby)) {
    return {
      preset:
        findPresetByNames(registryPresets, ["name", "full_name"]) ||
        shortTextPreset ||
        registryPresets[0] ||
        null,
      useDateFallback: false,
    };
  }

  return {
    preset: shortTextPreset || registryPresets[0] || null,
    useDateFallback: false,
  };
}

export function createBlockFromSuggestionWithPreset({
  suggestion,
  signingPartyId,
  presets,
}: {
  suggestion: MissingFieldSuggestion;
  signingPartyId: string;
  presets: ResolvedSystemPresetTemplate[];
}): IFormBlock {
  const { preset, useDateFallback } = resolveSuggestionPreset(suggestion, presets);
  const defaults = sanitizeFieldSchemaDefaults(preset?.field_schema_defaults);

  const fallbackType: IFormField["type"] = suggestion.inferredKind === "signature" ? "signature" : "text";
  const fieldType = (preset?.type as IFormField["type"] | undefined) || fallbackType;

  const baseFieldName = normalize(preset?.name || suggestion.inferredLabel || "field").replace(/[^a-z0-9]/g, "") || "field";
  const fieldKey = createUniqueFieldKey(baseFieldName);

  const dateFallback = useDateFallback ? buildDateValidatorPayload() : null;

  return {
    _id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    block_type: "form_field",
    signing_party_id: signingPartyId,
    order: 0,
    field_schema: {
      field: fieldKey,
      label: suggestion.inferredLabel || preset?.label || "New Field",
      tooltip_label: preset?.tooltip_label || "",
      type: fieldType,
      page: suggestion.page,
      x: suggestion.x,
      y: suggestion.y,
      w: Math.max(10, suggestion.w),
      h: Math.max(10, suggestion.h),
      align_h: defaults?.align_h || "center",
      align_v: defaults?.align_v || (fieldType === "signature" ? "bottom" : "middle"),
      shared: typeof preset?.shared === "boolean" ? preset.shared : true,
      source: (preset?.source || "manual") as IFormField["source"],
      ...(preset?.prefiller ? { prefiller: preset.prefiller } : {}),
      ...(preset?.validator ? { validator: preset.validator } : {}),
      ...(preset?.validator_ir ? { validator_ir: preset.validator_ir } : {}),
      ...(defaults?.size ? { size: defaults.size } : {}),
      ...(typeof defaults?.wrap === "boolean" ? { wrap: defaults.wrap } : { wrap: true }),
      ...(defaults?.font ? { font: defaults.font } : {}),
      ...(dateFallback ? dateFallback : {}),
    },
  };
}
