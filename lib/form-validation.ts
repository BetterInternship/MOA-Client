import { z } from "zod";
import { FormMetadata, type IFormMetadata } from "@betterinternship/core/forms";

/**
 * Validates a field value using the actual Zod validator from FormMetadata
 * This centralizes validation logic for use across form components
 */
export const validateFieldWithZod = (
  fieldKey: string,
  value: string,
  metadata: IFormMetadata
): string => {
  try {
    // Get fields from FormMetadata with actual Zod validators
    const formMetadataObj = new FormMetadata(metadata);
    const fields = formMetadataObj.getFieldsForClientService();

    // Find the field by name
    const field = fields.find((f) => f.field === fieldKey);

    if (!field) {
      return "";
    }

    // If no validator, no error
    if (!field.validator) {
      return "";
    }

    // Coerce the value using the field's coerce method
    const coerced = field.coerce(value);

    // Use the actual Zod validator
    const result = field.validator.safeParse(coerced);

    if (result.error) {
      // Extract error message using z.treeifyError
      const errorString = z
        .treeifyError(result.error)
        .errors.map((e) => e.split(" ").slice(0).join(" "))
        .join("\n");

      return `${errorString}`;
    }

    return "";
  } catch (err) {
    console.error("Validation error:", err);
    return "";
  }
};
