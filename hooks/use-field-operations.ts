/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:53:37
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 00:04:39
 * @ Description: Custom hook for form field operations
 *                Handles create, delete, duplicate, and update operations
 */

import { useCallback } from "react";
import type { FormField } from "@/components/docs/form-editor/field-box";

type FieldOperations = {
  create: (newField: FormField) => { fieldId: string };
  delete: (fieldId: string) => void;
  duplicate: (fieldId: string) => { fieldId: string };
  update: (fieldId: string, updates: Partial<FormField>) => void;
};

export const useFieldOperations = (
  fields: FormField[],
  onFieldsChange: (newFields: FormField[]) => void,
  onSelectedFieldChange?: (fieldId: string) => void,
  currentSelectedFieldId?: string
): FieldOperations => {
  const generateFieldId = useCallback((field: FormField, index: number) => {
    return `${field.field}:${index}`;
  }, []);

  const create = useCallback(
    (newField: FormField) => {
      const newFields = [...fields, newField];
      onFieldsChange(newFields);
      const newFieldIndex = newFields.length - 1;
      const fieldId = generateFieldId(newField, newFieldIndex);
      onSelectedFieldChange?.(fieldId);
      return { fieldId };
    },
    [fields, onFieldsChange, onSelectedFieldChange, generateFieldId]
  );

  const deleteField = useCallback(
    (fieldId: string) => {
      const targetIdx = parseInt(fieldId.split(":")[1], 10);
      const newFields = fields.filter((_, idx) => idx !== targetIdx);
      onFieldsChange(newFields);
      if (currentSelectedFieldId === fieldId) {
        onSelectedFieldChange?.("");
      }
    },
    [fields, onFieldsChange, onSelectedFieldChange, currentSelectedFieldId]
  );

  const duplicate = useCallback(
    (fieldId: string) => {
      const targetIdx = parseInt(fieldId.split(":")[1], 10);
      const fieldToDuplicate = fields[targetIdx];
      if (!fieldToDuplicate) return { fieldId: "" };

      const duplicated: FormField = {
        ...fieldToDuplicate,
        x: fieldToDuplicate.x + 20,
        y: fieldToDuplicate.y + 20,
      };

      const newFields = [...fields, duplicated];
      onFieldsChange(newFields);
      const newFieldIndex = newFields.length - 1;
      const newFieldId = generateFieldId(duplicated, newFieldIndex);
      onSelectedFieldChange?.(newFieldId);
      return { fieldId: newFieldId };
    },
    [fields, onFieldsChange, onSelectedFieldChange, generateFieldId]
  );

  const update = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      const newFields = fields.map((f, idx) => {
        const currentId = generateFieldId(f, idx);
        return currentId === fieldId ? { ...f, ...updates } : f;
      });
      onFieldsChange(newFields);
    },
    [fields, onFieldsChange, generateFieldId]
  );

  return { create, delete: deleteField, duplicate, update };
};
