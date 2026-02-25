import type { FieldPresetTemplate } from "@betterinternship/core/forms";

const normalize = (value: string) => value.trim().toLowerCase();

const cloneValidatorIr = (validatorIr: FieldPresetTemplate["validator_ir"]) =>
  validatorIr
    ? {
        ...validatorIr,
        rules: Array.isArray(validatorIr.rules)
          ? validatorIr.rules.map((rule) => ({ ...rule }))
          : [],
      }
    : null;

export function isDefaultPresetFieldKey(fieldKey: string, presets: FieldPresetTemplate[]): boolean {
  return findPresetByFieldKey(fieldKey, presets) !== null;
}

export function findPresetByFieldKey(
  fieldKey: string,
  presets: FieldPresetTemplate[]
): FieldPresetTemplate | null {
  const normalizedFieldKey = normalize(fieldKey || "");
  if (!normalizedFieldKey) return null;

  return (
    presets.find((preset) => {
      const presetName = normalize(preset.name || "");
      if (!presetName) return false;
      return (
        normalizedFieldKey === presetName || normalizedFieldKey.startsWith(`${presetName}_`)
      );
    }) || null
  );
}

export function applyPresetToSchema(
  _schema: unknown,
  preset: FieldPresetTemplate
): {
  type: FieldPresetTemplate["type"];
  validator: string;
  validator_ir: FieldPresetTemplate["validator_ir"];
} {
  return {
    type: preset.type,
    validator: preset.validator || "",
    validator_ir: cloneValidatorIr(preset.validator_ir),
  };
}
