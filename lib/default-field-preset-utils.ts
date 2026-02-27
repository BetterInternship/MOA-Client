import type { FieldPresetTemplate } from "@betterinternship/core/forms";

const normalize = (value: string) => value.trim().toLowerCase();

const hasTitleCaseInValidator = (validator: string) =>
  /toLocaleUpperCase\(\)\s*\+\s*\w+\.slice\(1\)\.toLocaleLowerCase\(\)\s*===\s*\w+/i.test(validator) ||
  /title case/i.test(validator);

const isNamePreset = (preset: Pick<FieldPresetTemplate, "id" | "name">) =>
  normalize(preset.name || "") === "name" || normalize(preset.id || "") === "preset-name";

const cloneValidatorIr = (
  preset: Pick<FieldPresetTemplate, "id" | "name" | "validator">,
  validatorIr: FieldPresetTemplate["validator_ir"]
) => {
  if (!validatorIr) return null;

  const cloned = {
    ...validatorIr,
    rules: Array.isArray(validatorIr.rules) ? validatorIr.rules.map((rule) => ({ ...rule })) : [],
  } as any;

  // Backward-compatible patch:
  // if a Name preset ships with raw title-case validator but IR only has plainText,
  // inject hidden titleCase IR rule so IR-canonical sync does not strip title-case.
  if (
    isNamePreset(preset) &&
    hasTitleCaseInValidator(String(preset.validator || "")) &&
    cloned.baseType === "text"
  ) {
    const hasPlainText = cloned.rules.some((rule: any) => rule?.kind === "plainText");
    const hasTitleCase = cloned.rules.some((rule: any) => rule?.kind === "titleCase");
    if (hasPlainText && !hasTitleCase) cloned.rules.push({ kind: "titleCase" });
  }

  return cloned as FieldPresetTemplate["validator_ir"];
};

export function normalizePresetTemplate(preset: FieldPresetTemplate): FieldPresetTemplate {
  return {
    ...preset,
    validator_ir: cloneValidatorIr(preset, preset.validator_ir),
  };
}

export function isDefaultPresetFieldKey(fieldKey: string, presets: FieldPresetTemplate[]): boolean {
  return findPresetByFieldKey(fieldKey, presets) !== null;
}

export function findPresetByFieldKey(
  fieldKey: string,
  presets: FieldPresetTemplate[]
): FieldPresetTemplate | null {
  const normalizedFieldKey = normalize(fieldKey || "");
  if (!normalizedFieldKey) return null;

  const presetSegment = normalizedFieldKey.includes(":")
    ? normalizedFieldKey.split(":").at(-1) || ""
    : "";
  if (presetSegment) {
    const bySegment =
      presets.find((preset) => {
        const presetId = normalize(preset.id || "");
        const presetName = normalize(preset.name || "");
        return presetSegment === presetId || presetSegment === presetName;
      }) || null;
    if (bySegment) return bySegment;
  }

  return (
    presets.find((preset) => {
      const presetName = normalize(preset.name || "");
      if (!presetName) return false;
      return normalizedFieldKey === presetName || normalizedFieldKey.startsWith(`${presetName}_`);
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
  const normalizedPreset = normalizePresetTemplate(preset);
  return {
    type: normalizedPreset.type,
    validator: normalizedPreset.validator || "",
    validator_ir: normalizedPreset.validator_ir,
  };
}
