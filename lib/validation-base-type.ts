import type { ValidatorBaseType, ValidatorIRv0 } from "@/lib/validator-ir";
import { validateValidatorIR } from "@/lib/validator-ir";

export function deriveValidatorBaseType(
  schemaType?: string,
  validator?: string,
  validatorIr?: unknown
): ValidatorBaseType {
  const validatorValue = validator || "";
  if (validatorIr) {
    const parsed = validateValidatorIR(validatorIr);
    if (parsed.ok) return (validatorIr as ValidatorIRv0).baseType;
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
  if (validatorValue.includes("z.coerce.date(") || validatorValue.includes("new Date("))
    return "date";
  if (validatorValue.includes("z.number(")) return "number";
  return "text";
}

