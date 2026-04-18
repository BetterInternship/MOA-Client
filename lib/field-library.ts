import { IFormBlock } from "@betterinternship/core/forms";

type RegistryLikeField = {
  id: string;
  name: string;
  label?: string;
  type?: string;
  validator?: string | null;
  validator_ir?: unknown;
  tag?: string;
  preset?: string;
};

// Backward-compatible system detection:
// - preferred legacy marker: tag='preset'
// - also accepts preset='system'
export const isPresetRegistryField = (field: RegistryLikeField) =>
  field.tag?.toLowerCase() === "preset" || field.preset?.toLowerCase() === "system";

// UI-friendly autocomplete options from registry records.
export const buildFieldOptionsFromRegistry = (fields: RegistryLikeField[]) =>
  fields
    .map((field) => ({
      id: field.name,
      name: field.label || field.name,
      type: field.type,
      validator: field.validator || "",
      validator_ir: field.validator_ir || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

export const buildPresetTemplatesFromRegistry = <T extends RegistryLikeField>(fields: T[]) =>
  fields
    .filter(isPresetRegistryField)
    .sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));

export const buildTagOptionsFromRegistry = (fields: RegistryLikeField[]) =>
  Array.from(
    new Set(fields.map((field) => field.tag?.trim()).filter((tag): tag is string => Boolean(tag)))
  ).sort((a, b) => a.localeCompare(b));

export const buildFieldOptionsFromBlocks = (blocks: IFormBlock[]) => {
  // Deduplicate by field key so duplicate blocks of the same field only appear once in selectors.
  const map = new Map<
    string,
    {
      id: string;
      name: string;
      type?: string;
      validator?: string;
      validator_ir?: unknown;
    }
  >();
  blocks.forEach((block) => {
    if (block.block_type !== "form_field" && block.block_type !== "form_phantom_field") return;
    const schema = block.field_schema || block.phantom_field_schema;
    const fieldName = schema?.field;
    if (!fieldName) return;
    map.set(fieldName, {
      id: fieldName,
      name: schema?.label || fieldName,
      type: schema?.type,
      validator: schema?.validator || "",
      validator_ir: schema?.validator_ir || null,
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};
