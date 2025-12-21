"use client";

import { useState, useEffect } from "react";
import {
  type IFormBlock,
  type IFormField,
  type IFormPhantomField,
  BLOCK_TYPES,
  SOURCES,
} from "@betterinternship/core/forms";
import { X } from "lucide-react";
import {
  FormInput,
  FormTextarea,
  FormDropdown,
  FormCheckbox,
} from "@/components/docs/forms/EditForm";
import { Button } from "@/components/ui/button";
import { capitalize, capitalizeWords } from "@/lib/string-utils";

interface BlockEditorProps {
  block: IFormBlock | null;
  onClose: () => void;
  onUpdate: (block: IFormBlock) => void;
  signingParties: Array<{ id: string; name: string }>;
}

/**
 * Deep editor for individual block properties
 * Shows different fields based on block type
 * Allows editing all properties of a block
 */
export const BlockEditor = ({ block, onClose, onUpdate, signingParties }: BlockEditorProps) => {
  const [editedBlock, setEditedBlock] = useState<IFormBlock | null>(block);

  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  if (!editedBlock) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Select a block to edit</p>
      </div>
    );
  }

  const handleFieldChange = (key: keyof IFormBlock, value: any) => {
    let newBlock = editedBlock ? { ...editedBlock, [key]: value } : null;
    if (newBlock && key === "block_type") {
      // When changing block type, initialize appropriate schema and clear others
      const blockType = value;
      const currentSchema = editedBlock.field_schema || editedBlock.phantom_field_schema;

      // Common properties to retain when switching between form_field and form_phantom_field
      const commonProps = currentSchema
        ? {
            field: currentSchema.field || "",
            type: currentSchema.type || "text",
            label: currentSchema.label || "",
            tooltip_label: currentSchema.tooltip_label || "",
            shared: "shared" in currentSchema ? currentSchema.shared : false,
            source: currentSchema.source || "manual",
            signing_party_id:
              "signing_party_id" in currentSchema ? currentSchema.signing_party_id : "",
          }
        : null;

      if (blockType === "form_field") {
        newBlock = {
          ...newBlock,
          field_schema: {
            field: commonProps?.field || "",
            type: commonProps?.type || "text",
            label: commonProps?.label || "",
            tooltip_label: commonProps?.tooltip_label || "",
            shared: commonProps?.shared || false,
            source: commonProps?.source || "manual",
            signing_party_id: commonProps?.signing_party_id || "",
            x: editedBlock.field_schema?.x || 0,
            y: editedBlock.field_schema?.y || 0,
            w: editedBlock.field_schema?.w || 100,
            h: editedBlock.field_schema?.h || 20,
            page: editedBlock.field_schema?.page || 0,
          },
          phantom_field_schema: undefined,
        };
      } else if (blockType === "form_phantom_field") {
        newBlock = {
          ...newBlock,
          phantom_field_schema: {
            field: commonProps?.field || "",
            type: commonProps?.type || "text",
            label: commonProps?.label || "",
            tooltip_label: commonProps?.tooltip_label || "",
            shared: commonProps?.shared || false,
            source: commonProps?.source || "manual",
            signing_party_id: commonProps?.signing_party_id || "",
          },
          field_schema: undefined,
        };
      } else {
        // For other types (header, paragraph), clear both schemas
        newBlock = {
          ...newBlock,
          field_schema: undefined,
          phantom_field_schema: undefined,
        };
      }
    }
    if (newBlock) {
      setEditedBlock(newBlock);
      onUpdate(newBlock);
    }
  };

  const handleFieldSchemaChange = (key: keyof IFormField, value: any) => {
    if (editedBlock.block_type !== "form_field" || !editedBlock.field_schema) return;
    const updatedField = { ...editedBlock.field_schema, [key]: value };
    const newBlock = { ...editedBlock, field_schema: updatedField };
    setEditedBlock(newBlock);
    onUpdate(newBlock);
  };

  const handlePhantomFieldSchemaChange = (key: keyof IFormPhantomField, value: any) => {
    if (editedBlock.block_type !== "form_phantom_field" || !editedBlock.phantom_field_schema)
      return;
    const updatedField = { ...editedBlock.phantom_field_schema, [key]: value };
    const newBlock = { ...editedBlock, phantom_field_schema: updatedField };
    setEditedBlock(newBlock);
    onUpdate(newBlock);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-3">
        <h3 className="text-sm font-semibold text-gray-900">Block Editor</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <FormDropdown
          label="Block Type"
          value={editedBlock.block_type}
          setter={(val) => handleFieldChange("block_type", val as any)}
          options={BLOCK_TYPES.map((type) => ({
            id: type,
            name: capitalizeWords(type),
          }))}
          required={false}
        />

        {/* Signing Party */}
        <FormDropdown
          label="Signing Party"
          value={editedBlock.signing_party_id || ""}
          setter={(val) => handleFieldChange("signing_party_id", val as string)}
          options={[{ id: "", name: "Select a party..." }, ...signingParties]}
          required={false}
        />

        {/* Content Fields for Headers/Paragraphs */}
        {(editedBlock.block_type === "header" || editedBlock.block_type === "paragraph") && (
          <FormTextarea
            label="Text Content"
            value={editedBlock.text_content || ""}
            setter={(val) => handleFieldChange("text_content", val)}
            required={false}
          />
        )}

        {/* Form Field Schema */}
        {editedBlock.block_type === "form_field" && editedBlock.field_schema && (
          <div className="space-y-3 rounded border-l-4 border-blue-300 bg-blue-50/50 p-3">
            <div className="text-xs font-semibold text-gray-700">Field Schema</div>

            <FormInput
              label="Field Name"
              value={editedBlock.field_schema.field}
              setter={(val) => handleFieldSchemaChange("field", val)}
              required={false}
            />

            <FormInput
              label="Label"
              value={editedBlock.field_schema.label}
              setter={(val) => handleFieldSchemaChange("label", val)}
              required={false}
            />

            <FormDropdown
              label="Source"
              value={editedBlock.field_schema.source}
              setter={(val) => handleFieldSchemaChange("source", val as any)}
              options={SOURCES.map((source) => ({
                id: source,
                name: capitalizeWords(source),
              }))}
              required={false}
            />

            <FormInput
              label="Tooltip Label"
              value={editedBlock.field_schema.tooltip_label || ""}
              setter={(val) => handleFieldSchemaChange("tooltip_label", val)}
              required={false}
            />

            <FormCheckbox
              label="Shared Field"
              checked={editedBlock.field_schema.shared}
              setter={(val) => handleFieldSchemaChange("shared", val)}
            />

            <FormTextarea
              label="Validator (Zod Schema)"
              value={editedBlock.field_schema.validator || ""}
              setter={(val) => handleFieldSchemaChange("validator", val)}
              required={false}
            />

            <FormTextarea
              label="Prefiller (JS Function)"
              value={editedBlock.field_schema.prefiller || ""}
              setter={(val) => handleFieldSchemaChange("prefiller", val)}
              required={false}
            />
          </div>
        )}

        {/* Phantom Field Schema */}
        {editedBlock.block_type === "form_phantom_field" && editedBlock.phantom_field_schema && (
          <div className="space-y-3 rounded border-l-4 border-amber-300 bg-amber-50/50 p-3">
            <div className="text-xs font-semibold text-gray-700">Phantom Field Schema</div>

            <FormInput
              label="Field Name"
              value={editedBlock.phantom_field_schema.field}
              setter={(val) => handlePhantomFieldSchemaChange("field", val)}
              required={false}
            />

            <FormInput
              label="Label"
              value={editedBlock.phantom_field_schema.label}
              setter={(val) => handlePhantomFieldSchemaChange("label", val)}
              required={false}
            />

            <FormDropdown
              label="Source"
              value={editedBlock.phantom_field_schema.source}
              setter={(val) => handlePhantomFieldSchemaChange("source", val as any)}
              options={SOURCES.map((source) => ({
                id: source,
                name: capitalizeWords(source),
              }))}
              required={false}
            />

            <FormInput
              label="Tooltip Label"
              value={editedBlock.phantom_field_schema.tooltip_label || ""}
              setter={(val) => handlePhantomFieldSchemaChange("tooltip_label", val)}
              required={false}
            />

            <FormCheckbox
              label="Shared Field"
              checked={editedBlock.phantom_field_schema.shared}
              setter={(val) => handlePhantomFieldSchemaChange("shared", val)}
            />

            <FormTextarea
              label="Validator (Zod Schema)"
              value={editedBlock.phantom_field_schema.validator || ""}
              setter={(val) => handlePhantomFieldSchemaChange("validator", val)}
              required={false}
            />

            <FormTextarea
              label="Prefiller (JS Function)"
              value={editedBlock.phantom_field_schema.prefiller || ""}
              setter={(val) => handlePhantomFieldSchemaChange("prefiller", val)}
              required={false}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white p-3">
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
};
