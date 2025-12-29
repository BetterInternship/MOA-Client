/**
 * @ Author: BetterInternship
 * @ Description: Utility functions for consistent field ID generation and resolution
 * Ensures stable, DRY field identification across the entire form editor
 */

import type { FormField } from "@/components/docs/form-editor/form-pdf-editor/FieldBox";

/**
 * Generate a stable field ID from a FormField object
 * Uses _id if available, falls back to fieldName:pageNumber composite key
 */
export const getFieldId = (field: FormField | undefined | null): string => {
  if (!field) return "";
  return field._id || `${field.field}:${field.page}`;
};

/**
 * Find a field by its stable ID
 * Handles both _id and legacy fieldName:pageNumber formats
 */
export const findFieldById = (fields: FormField[], fieldId: string): FormField | undefined => {
  return fields.find((f) => getFieldId(f) === fieldId);
};

/**
 * Generate a globally unique _id for a new field
 */
export const generateBlockId = (): string => {
  // Use timestamp + random to ensure uniqueness across duplications
  return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Ensure a field has a unique _id
 * Returns the field with _id populated if missing
 */
export const ensureFieldId = (field: FormField): FormField => {
  return {
    ...field,
    _id: field._id || generateBlockId(),
  };
};
