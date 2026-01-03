/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-16 23:53:37
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 00:04:39
 * @ Description: Custom hook for form field operations
 *                Handles create, delete, duplicate, and update operations
 */

import { useCallback } from "react";
import type { FormField } from "@/components/docs/form-editor/form-pdf-editor/FieldBox";
import { getFieldId as utilGetFieldId, generateBlockId } from "@/lib/field-id-utils";

type FieldOperations = {
  create: (newField: FormField) => { fieldId: string };
  delete: (fieldId: string) => void;
  duplicate: (fieldId: string) => { fieldId: string };
  update: (fieldId: string, updates: Partial<FormField>) => void;
};

/**
 * Generate a stable field ID from a field's _id property
 */
const getFieldId = utilGetFieldId;

export const useFieldOperations = (
  fields: FormField[],
  onFieldsChange: (newFields: FormField[]) => void,
  onSelectedFieldChange?: (fieldId: string) => void,
  currentSelectedFieldId?: string
): FieldOperations => {
  const create = useCallback(
    (newField: FormField) => {
      // Ensure new field has a unique _id
      const fieldWithId: FormField = {
        ...newField,
        _id: newField._id || generateBlockId(),
      };
      const newFields = [...fields, fieldWithId];
      onFieldsChange(newFields);
      const fieldId = getFieldId(fieldWithId);
      onSelectedFieldChange?.(fieldId);
      return { fieldId };
    },
    [fields, onFieldsChange, onSelectedFieldChange]
  );

  const deleteField = useCallback(
    (fieldId: string) => {
      const newFields = fields.filter((f) => getFieldId(f) !== fieldId);
      onFieldsChange(newFields);
      if (currentSelectedFieldId === fieldId) {
        onSelectedFieldChange?.("");
      }
    },
    [fields, onFieldsChange, onSelectedFieldChange, currentSelectedFieldId]
  );

  const duplicate = useCallback(
    (fieldId: string) => {
      const fieldToDuplicate = fields.find((f) => getFieldId(f) === fieldId);
      if (!fieldToDuplicate) return { fieldId: "" };

      // Ensure the duplicated field has a unique _id that's different from the original
      const newId = generateBlockId();
      const duplicated: FormField = {
        ...fieldToDuplicate,
        _id: newId, // Always ensure a new unique _id
        x: fieldToDuplicate.x + 20,
        y: fieldToDuplicate.y + 20,
      };

      const newFields = [...fields, duplicated];
      onFieldsChange(newFields);
      const newFieldId = getFieldId(duplicated);
      onSelectedFieldChange?.(newFieldId);
      return { fieldId: newFieldId };
    },
    [fields, onFieldsChange, onSelectedFieldChange]
  );

  const update = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      const newFields = fields.map((f) => {
        return getFieldId(f) === fieldId ? { ...f, ...updates } : f;
      });
      onFieldsChange(newFields);
    },
    [fields, onFieldsChange]
  );

  return { create, delete: deleteField, duplicate, update };
};
