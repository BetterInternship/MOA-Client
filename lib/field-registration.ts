/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-18
 * @ Modified by: Your name
 * @ Modified time: 2025-12-21 17:52:51
 */

import type { FormField } from "@/components/docs/form-editor/form-pdf-editor/FieldBox";
import type { IFormField, IFormBlock, IFormMetadata } from "@betterinternship/core/forms";
import { SCHEMA_VERSION } from "@betterinternship/core/forms";

/**
 * Convert editor FormField to IFormField (metadata schema format)
 * Molds the field to match the expected metadata structure
 */
export const moldFieldToMetadata = (editorField: FormField): IFormField => {
  const label = String(editorField.label ?? "");
  return {
    field: editorField.field,
    label,
    page: editorField.page,
    x: editorField.x,
    y: editorField.y,
    w: editorField.w,
    h: editorField.h,
    // Use alignment from field, with defaults
    align_h: editorField.align_h ?? ("left" as const),
    align_v: editorField.align_v ?? ("top" as const),
    // Optional fields - can be populated later
    validator: "",
    prefiller: "",
    tooltip_label: label,
    // Required fields with defaults
    type: "text" as const,
    source: "manual" as const,
    signing_party_id: "party-1",
    shared: true,
  };
};

/**
 * Convert multiple editor fields to metadata blocks
 * Creates IFormBlock objects with form_field type
 */
export const moldFieldsToBlocks = (editorFields: FormField[]): IFormBlock[] => {
  return editorFields.map((field, index) => ({
    block_type: "form_field" as const,
    order: index,
    signing_party_id: "party-1",
    field_schema: moldFieldToMetadata(field),
  }));
};

/**
 * Generate complete form metadata from fields
 * This is the structure that gets sent to the backend
 * Uses block-centric structure matching IFormMetadata interface
 */
export const generateFormMetadata = (
  fields: FormField[],
  formName: string = "",
  formLabel: string = ""
): IFormMetadata => {
  const blocks = moldFieldsToBlocks(fields);

  return {
    name: formName,
    label: formLabel || formName,
    schema_version: SCHEMA_VERSION,
    schema: {
      blocks,
    },
    signing_parties: [
      {
        _id: "party-1",
        order: 1,
        signatory_account: {
          account_id: "user-1",
          name: "Student",
          email: "student@example.com",
        },
        signed: false,
      },
    ],
    subscribers: [],
  };
};

/**
 * Validate field registration - ensures all required fields are present
 */
export const validateFieldRegistration = (
  field: FormField
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!field.field) errors.push("Field type is required");
  if (!field.label) errors.push("Field label is required");
  if (field.page < 1) errors.push("Page number must be at least 1");
  if (field.w <= 0) errors.push("Field width must be greater than 0");
  if (field.h <= 0) errors.push("Field height must be greater than 0");
  if (field.x < 0) errors.push("X coordinate cannot be negative");
  if (field.y < 0) errors.push("Y coordinate cannot be negative");

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Pretty print metadata for display
 */
export const formatMetadataForDisplay = (metadata: IFormMetadata): string => {
  return JSON.stringify(metadata, null, 2);
};
