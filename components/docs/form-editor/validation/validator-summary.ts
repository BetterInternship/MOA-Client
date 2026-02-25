import type { ValidatorConfig } from "@/lib/validator-engine";
import type { ValidatorBaseType } from "@/lib/validator-ir";
import {
  getDateRelativeValidator,
  getToggleValidatorViewModel,
} from "@/components/docs/form-editor/validation/validator-state";

/**
 * Compact human-readable summary used below the "Validation" header.
 * This is display-only and intentionally derived from current config each render.
 */
export function buildValidatorSummary(config: ValidatorConfig, baseType: ValidatorBaseType): string {
  const vm = getToggleValidatorViewModel(config);
  const parts: string[] = [];

  if (vm.required.enabled) parts.push("Required");

  if (baseType === "text" || baseType === "textarea") {
    if (vm.minLength.enabled && typeof vm.minLength.value === "number") {
      parts.push(`Min ${vm.minLength.value}`);
    }
    if (vm.maxLength.enabled && typeof vm.maxLength.value === "number") {
      parts.push(`Max ${vm.maxLength.value}`);
    }
    if (vm.plainText.enabled) parts.push("Plain text");
    if (baseType === "textarea" && vm.trim.enabled) parts.push("Trim");
    if (vm.regex.enabled) parts.push("Pattern");
  }

  if (baseType === "number") {
    if (vm.min.enabled && typeof vm.min.value === "number") parts.push(`Min ${vm.min.value}`);
    if (vm.max.enabled && typeof vm.max.value === "number") parts.push(`Max ${vm.max.value}`);
  }

  if (baseType === "date") {
    if (vm.minDate.enabled && vm.minDate.value) parts.push(`From ${vm.minDate.value}`);
    if (vm.maxDate.enabled && vm.maxDate.value) parts.push(`Until ${vm.maxDate.value}`);
    const relative = getDateRelativeValidator(config);
    if (relative.kind === "dateOnOrAfterToday") parts.push("On/after today");
    if (relative.kind === "dateOnOrBeforeToday") parts.push("On/before today");
    if (relative.kind === "dateOnOrAfterField") parts.push(`After ${relative.field}`);
    if (relative.kind === "dateOnOrBeforeField") parts.push(`Before ${relative.field}`);
  }

  if (baseType === "time") {
    if (vm.minTime.enabled && vm.minTime.value) parts.push(`After ${vm.minTime.value}`);
    if (vm.maxTime.enabled && vm.maxTime.value) parts.push(`Before ${vm.maxTime.value}`);
  }

  if (baseType === "array") {
    if (vm.minItems.enabled && typeof vm.minItems.value === "number") {
      parts.push(`Min items ${vm.minItems.value}`);
    }
    if (vm.maxItems.enabled && typeof vm.maxItems.value === "number") {
      parts.push(`Max items ${vm.maxItems.value}`);
    }
  }

  if (parts.length === 0) return "No constraints";
  return parts.join(" | ");
}
