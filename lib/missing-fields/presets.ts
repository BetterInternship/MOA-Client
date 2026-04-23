import type { IFormBlock, IFormField } from "@betterinternship/core/forms";
import type { ResolvedSystemPresetTemplate } from "@/lib/system-preset-resolver";
import { sanitizeFieldSchemaDefaults } from "@/lib/field-schema-defaults";
import type { MissingFieldSuggestion } from "@/lib/missing-fields/types";
import { persistedIRToZod, validatorConfigToPersistedIR } from "@/lib/validator-ir";

type DatabaseFieldLike = {
  id?: string;
  name?: string;
  label?: string;
  type?: string;
  source?: string;
  shared?: boolean;
  prefiller?: string | null;
  tooltip_label?: string | null;
  validator?: string | null;
  validator_ir?: unknown;
  field_schema_defaults?: unknown;
};

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

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const mapSuggestionKindToFieldType = (kind: MissingFieldSuggestion["inferredKind"]): IFormField["type"] =>
  kind === "signature" ? "signature" : "text";

const resolveDatabaseFieldMatch = (
  suggestion: MissingFieldSuggestion,
  registryFields: DatabaseFieldLike[]
): DatabaseFieldLike | null => {
  if (!registryFields.length) return null;

  const query = `${suggestion.inferredLabel} ${suggestion.nearbyText}`.toLowerCase();
  const queryTokens = new Set(tokenize(query));
  const preferredType = mapSuggestionKindToFieldType(suggestion.inferredKind);

  let best: { field: DatabaseFieldLike; score: number } | null = null;

  for (const field of registryFields) {
    const name = String(field.name || "").trim();
    const label = String(field.label || "").trim();
    if (!name && !label) continue;

    const haystack = `${name} ${label}`.toLowerCase();
    const haystackNorm = normalize(haystack);
    const nameNorm = normalize(name);
    const labelNorm = normalize(label);

    let score = 0;
    const fieldType = field.type === "signature" ? "signature" : "text";

    if (fieldType === preferredType) score += 2;
    if (query.includes(haystack)) score += 6;
    if (query.includes(name.toLowerCase())) score += 4;
    if (query.includes(label.toLowerCase())) score += 4;

    for (const token of queryTokens) {
      if (token.length < 3) continue;
      if (nameNorm.includes(normalize(token))) score += 2;
      if (labelNorm.includes(normalize(token))) score += 2;
      if (haystackNorm.includes(normalize(token))) score += 1;
    }

    if (suggestion.inferredKind === "date" && /\bdate\b/.test(haystack)) score += 4;
    if (suggestion.inferredKind === "signature" && /\bsign/.test(haystack)) score += 4;

    if (score < 5) continue;
    if (!best || score > best.score) {
      best = { field, score };
    }
  }

  return best?.field || null;
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
  registryFields = [],
}: {
  suggestion: MissingFieldSuggestion;
  signingPartyId: string;
  presets: ResolvedSystemPresetTemplate[];
  registryFields?: DatabaseFieldLike[];
}): IFormBlock {
  const dbMatch = resolveDatabaseFieldMatch(suggestion, registryFields);
  const { preset, useDateFallback } = resolveSuggestionPreset(suggestion, presets);
  const defaults = sanitizeFieldSchemaDefaults(
    dbMatch?.field_schema_defaults ?? preset?.field_schema_defaults
  );

  const fallbackType: IFormField["type"] = suggestion.inferredKind === "signature" ? "signature" : "text";
  const fieldType =
    ((dbMatch?.type as IFormField["type"] | undefined) ||
      (preset?.type as IFormField["type"] | undefined) ||
      fallbackType);
  const isLineLikeSuggestion =
    suggestion.patternType === "horizontal-line" || suggestion.patternType === "underscore";

  const baseFieldName = normalize(
    dbMatch?.name || preset?.name || suggestion.inferredLabel || "field"
  ).replace(/[^a-z0-9]/g, "") || "field";
  const fieldKey = createUniqueFieldKey(baseFieldName);

  const shouldUseDateFallback = !dbMatch && useDateFallback;
  const dateFallback = shouldUseDateFallback ? buildDateValidatorPayload() : null;

  return {
    _id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    block_type: "form_field",
    signing_party_id: signingPartyId,
    order: 0,
    field_schema: {
      field: fieldKey,
      label: dbMatch?.label || suggestion.inferredLabel || preset?.label || "New Field",
      tooltip_label: dbMatch?.tooltip_label || preset?.tooltip_label || "",
      type: fieldType,
      page: suggestion.page,
      x: suggestion.x,
      y: suggestion.y,
      w: Math.max(10, suggestion.w),
      h: Math.max(10, suggestion.h),
      align_h: defaults?.align_h || "center",
      align_v:
        defaults?.align_v || (fieldType === "signature" || isLineLikeSuggestion ? "bottom" : "middle"),
      shared:
        typeof dbMatch?.shared === "boolean"
          ? dbMatch.shared
          : typeof preset?.shared === "boolean"
            ? preset.shared
            : true,
      source: ((dbMatch?.source || preset?.source || "manual") as IFormField["source"]),
      ...(dbMatch?.prefiller
        ? { prefiller: dbMatch.prefiller }
        : preset?.prefiller
          ? { prefiller: preset.prefiller }
          : {}),
      ...(dbMatch?.validator
        ? { validator: dbMatch.validator }
        : preset?.validator
          ? { validator: preset.validator }
          : {}),
      ...(dbMatch?.validator_ir
        ? { validator_ir: dbMatch.validator_ir as any }
        : preset?.validator_ir
          ? { validator_ir: preset.validator_ir }
          : {}),
      ...(defaults?.size ? { size: defaults.size } : {}),
      ...(typeof defaults?.wrap === "boolean" ? { wrap: defaults.wrap } : { wrap: true }),
      ...(defaults?.font ? { font: defaults.font } : {}),
      ...(dateFallback ? dateFallback : {}),
    },
  };
}
