import { zodToPersistedIR, validateValidatorIR, type ValidatorIRv0 } from "@/lib/validator-ir";
import type { ValidatorBaseType } from "@/lib/validator-ir";

export type ValidationImportState = ReturnType<typeof zodToPersistedIR>;

export function resolveValidationImportState(
  validator: string,
  baseType: ValidatorBaseType,
  validatorIr?: ValidatorIRv0 | null
): ValidationImportState {
  if (validatorIr) {
    const validity = validateValidatorIR(validatorIr);
    if (validity.ok && validatorIr.baseType === baseType) {
      return { status: "exact", ir: validatorIr };
    }
  }

  return zodToPersistedIR(validator || "", baseType);
}

export function isLegacyValidationState(state: ValidationImportState): boolean {
  return state.status !== "exact";
}

