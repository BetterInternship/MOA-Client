import { IFormBlock } from "@betterinternship/core/forms";

type RegistryLikeField = {
  id: string;
  name: string;
  label?: string;
  tag?: string;
  preset?: string;
};

export const isPresetRegistryField = (field: RegistryLikeField) =>
  field.preset?.toLowerCase() === "preset" || field.tag?.toLowerCase() === "preset";

export const buildFieldOptionsFromRegistry = (fields: RegistryLikeField[]) =>
  fields
    .map((field) => ({
      id: field.name,
      name: field.label || field.name,
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
  const map = new Map<string, { id: string; name: string }>();
  blocks.forEach((block) => {
    if (block.block_type !== "form_field") return;
    const fieldName = block.field_schema?.field;
    if (!fieldName) return;
    map.set(fieldName, {
      id: fieldName,
      name: block.field_schema?.label || fieldName,
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};
