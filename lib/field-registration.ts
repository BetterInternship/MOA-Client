/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-18
 * @ Modified by: Your name
 * @ Modified time: 2025-12-18 19:12:22

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
    align_h: editorField.align_h ?? ("center" as const),
    align_v: editorField.align_v ?? ("middle" as const),
    // Optional fields - can be populated later
    validator: "",
    prefiller: "",
    tooltip_label: "",
    // Required fields with defaults
    type: "text",
    source: "manual" as const,
    party: "university" as const,
    shared: false,
  };
};

/**
 * Convert multiple editor fields to metadata schema
 */
export const moldFieldsToMetadata = (editorFields: FormField[]): IFormField[] => {
  return editorFields.map(moldFieldToMetadata);
};

/**
 * Generate complete form metadata from fields
 * This is the structure that gets sent to the backend
 */
export const generateFormMetadata = (
  fields: FormField[],
  formName: string = "",
  formLabel: string = ""
): IFormMetadata => {
  const metadataFields = moldFieldsToMetadata(fields);
  const schemaVersion = 0; // Default schema version

  return {
    name: formName,
    label: formLabel || formName,
    schema_version: schemaVersion,
    schema: metadataFields,
    schema_phantoms: [],
    subscribers: [],
    signatories: [],
    required_parties: [],
    params: {},
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
