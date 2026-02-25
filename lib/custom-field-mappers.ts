import type { ValidatorIRv0 } from "@/lib/validator-ir";

export const FIELD_SOURCES = ["auto", "prefill", "derived", "manual"] as const;
export type FieldSource = (typeof FIELD_SOURCES)[number];

export const isFieldSource = (value: unknown): value is FieldSource =>
  typeof value === "string" && FIELD_SOURCES.includes(value as FieldSource);

export const normalizeFieldSource = (value: unknown, fallback: FieldSource = "manual"): FieldSource =>
  isFieldSource(value) ? value : fallback;

export type CustomFieldDraftModel = {
  name: string;
  label: string;
  type: "text" | "signature" | "image";
  party?: string;
  shared?: boolean;
  source: FieldSource;
  tag: string;
  prefiller?: string;
  preset?: string;
  tooltip_label?: string;
  validator?: string;
  validator_ir?: ValidatorIRv0 | null;
  is_phantom?: boolean;
};

type PresetLikeField = Partial<CustomFieldDraftModel> & {
  label?: string;
  prefiller?: string | null;
  tooltip_label?: string | null;
  validator?: string | null;
};

export const createCustomFieldDraftFromPreset = (
  preset: PresetLikeField,
  deriveName: (label: string) => string,
  defaultTag: string
): CustomFieldDraftModel => {
  // Normalizes package preset metadata into a fully editable local draft.
  const label = preset.label || "Custom Field";
  return {
    name: deriveName(label),
    label,
    type: (preset.type as "text" | "signature" | "image") || "text",
    party: preset.party || "",
    shared: preset.shared ?? true,
    source: preset.source || "manual",
    tag: preset.tag || defaultTag,
    prefiller: preset.prefiller || "",
    preset: preset.preset || "default",
    tooltip_label: preset.tooltip_label || "",
    validator: preset.validator || "",
    validator_ir: preset.validator_ir || null,
    is_phantom: preset.is_phantom ?? false,
  };
};

export const toRegisterFieldPayload = (
  draft: CustomFieldDraftModel,
  options?: {
    defaultTag?: string;
    preset?: string;
  }
) => ({
  // API payload normalization. Empty strings become null where backend expects nullable columns.
  name: draft.name.trim(),
  label: draft.label.trim(),
  type: draft.type,
  party: (draft.party || "__deprecated").trim(),
  shared: draft.shared ?? true,
  source: draft.source,
  tag: draft.tag?.trim() || options?.defaultTag || "uncategorized",
  prefiller: draft.prefiller?.trim() || null,
  preset: options?.preset || draft.preset || "default",
  tooltip_label: draft.tooltip_label?.trim() || null,
  validator: draft.validator?.trim() || null,
  validator_ir: draft.validator_ir ?? null,
  is_phantom: draft.is_phantom ?? false,
});
