import { SOURCES } from "@betterinternship/core/forms";

export type FieldSource = (typeof SOURCES)[number];

export type CustomFieldDraftModel = {
  name: string;
  label: string;
  type: "text" | "signature";
  party?: string;
  shared?: boolean;
  source: FieldSource;
  tag: string;
  prefiller?: string;
  preset?: string;
  tooltip_label?: string;
  validator?: string;
  is_phantom?: boolean;
};

type PresetLikeField = Partial<CustomFieldDraftModel> & {
  label?: string;
};

export const createCustomFieldDraftFromPreset = (
  preset: PresetLikeField,
  deriveName: (label: string) => string,
  defaultTag: string
): CustomFieldDraftModel => {
  const label = preset.label || "Custom Field";
  return {
    name: deriveName(label),
    label,
    type: (preset.type as "text" | "signature") || "text",
    party: preset.party || "",
    shared: preset.shared ?? true,
    source: preset.source || "manual",
    tag: preset.tag || defaultTag,
    prefiller: preset.prefiller || "",
    preset: preset.preset || "default",
    tooltip_label: preset.tooltip_label || "",
    validator: preset.validator || "",
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
  is_phantom: draft.is_phantom ?? false,
});
