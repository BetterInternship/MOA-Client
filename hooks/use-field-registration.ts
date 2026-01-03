/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-18
 * @ Description: Hook for managing field registration workflow
 */

import { useCallback } from "react";
import type { FormField } from "@/components/docs/form-editor/form-pdf-editor/FieldBox";
import { generateFormMetadata, validateFieldRegistration } from "@/lib/field-registration";
import type { IFormMetadata } from "@betterinternship/core/forms";

export interface RegistrationState {
  metadata: IFormMetadata | null;
  isValid: boolean;
  errors: string[];
}

/**
 * Hook for handling field registration
 * Validates, molds fields to metadata format, and prepares for submission
 */
export const useFieldRegistration = (formName: string = "", formLabel: string = "") => {
  /**
   * Register a single field and return its metadata
   */
  const registerField = useCallback(
    (field: FormField): RegistrationState => {
      const validation = validateFieldRegistration(field);

      if (!validation.valid) {
        return {
          metadata: null,
          isValid: false,
          errors: validation.errors,
        };
      }

      const metadata = generateFormMetadata([field], formName, formLabel);

      return {
        metadata,
        isValid: true,
        errors: [],
      };
    },
    [formName, formLabel]
  );

  /**
   * Register multiple fields at once
   */
  const registerFields = useCallback(
    (fields: FormField[]): RegistrationState => {
      const validationErrors: string[] = [];

      // Validate all fields
      fields.forEach((field, idx) => {
        const validation = validateFieldRegistration(field);
        validation.errors.forEach((error) => {
          validationErrors.push(`Field ${idx + 1}: ${error}`);
        });
      });

      if (validationErrors.length > 0) {
        return {
          metadata: null,
          isValid: false,
          errors: validationErrors,
        };
      }

      const metadata = generateFormMetadata(fields, formName, formLabel);

      return {
        metadata,
        isValid: true,
        errors: [],
      };
    },
    [formName, formLabel]
  );

  return {
    registerField,
    registerFields,
  };
};
