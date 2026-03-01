import type { ValidatorBaseType, ValidatorIRv0 } from "@/lib/validator-ir";
import { validateValidatorIR } from "@/lib/validator-ir";

function inferSpecializedTextBase(validatorValue: string): ValidatorBaseType | null {
  if (validatorValue.includes('describe("textarea")')) return "textarea";
  if (validatorValue.includes('describe("time")')) return "time";
  if (validatorValue.includes(".email(")) return "email";
  if (validatorValue.includes(".url(")) return "url";
  if (
    validatorValue.includes('describe("phone")') ||
    validatorValue.includes("\\+?[0-9()\\-\\s]{7,20}")
  )
    return "phone";
  if (validatorValue.includes("z.coerce.date(") || validatorValue.includes("new Date("))
    return "date";
  if (validatorValue.includes("z.number(") || validatorValue.includes("z.coerce.number("))
    return "number";
  return null;
}

export function deriveValidatorBaseType(
  schemaType?: string,
  validator?: string,
  validatorIr?: unknown
): ValidatorBaseType {
  const validatorValue = validator || "";
  if (validatorIr) {
    const parsed = validateValidatorIR(validatorIr);
    if (parsed.ok) {
      const irBaseType = (validatorIr as ValidatorIRv0).baseType;

      // Backward-compat: older records may store text base IR for format validators.
      // Prefer explicit validator markers in that case so UI rule groups stay correct.
      if (irBaseType === "text") {
        const specialized = inferSpecializedTextBase(validatorValue);
        if (specialized) return specialized;
      }

      return irBaseType;
    }
  }

  if (schemaType === "signature") return "signature";
  if (schemaType === "image") return "image";
  if (validatorValue.includes('describe("multiselect")') || validatorValue.includes("z.array("))
    return "array";
  if (validatorValue.includes("z.enum(") || validatorValue.includes('describe("dropdown")'))
    return "enum";
  if (validatorValue.includes('describe("checkbox")') || validatorValue.includes("z.boolean("))
    return "checkbox";
  if (validatorValue.includes('describe("textarea")')) return "textarea";
  if (validatorValue.includes('describe("time")')) return "time";
  if (validatorValue.includes(".email(")) return "email";
  if (validatorValue.includes(".url(")) return "url";
  if (
    validatorValue.includes('describe("phone")') ||
    validatorValue.includes("\\+?[0-9()\\-\\s]{7,20}")
  )
    return "phone";
  if (validatorValue.includes("z.coerce.date(") || validatorValue.includes("new Date("))
    return "date";
  if (validatorValue.includes("z.number(")) return "number";
  return "text";
}
