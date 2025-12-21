"use client";

import { useState, useEffect } from "react";
import {
  type IFormBlock,
  type IFormField,
  type IFormPhantomField,
} from "@betterinternship/core/forms";
import { X } from "lucide-react";

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
    setEditedBlock((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };

  const handleFieldSchemaChange = (key: keyof IFormField, value: any) => {
    if (editedBlock.block_type !== "form_field" || !editedBlock.field_schema) return;
    const updatedField = { ...editedBlock.field_schema, [key]: value };
    setEditedBlock({ ...editedBlock, field_schema: updatedField });
  };

  const handlePhantomFieldSchemaChange = (key: keyof IFormPhantomField, value: any) => {
    if (editedBlock.block_type !== "form_phantom_field" || !editedBlock.phantom_field_schema)
      return;
    const updatedField = { ...editedBlock.phantom_field_schema, [key]: value };
    setEditedBlock({ ...editedBlock, phantom_field_schema: updatedField });
  };

  const handleSave = () => {
    if (editedBlock) {
      onUpdate(editedBlock);
      onClose();
    }
  };

  const blockTypeName = editedBlock.block_type.replace(/_/g, " ").toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Block Editor</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Block Type Badge */}
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-600">BLOCK TYPE</p>
          <div className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-900">
            {blockTypeName}
          </div>
        </div>

        {/* Common Fields */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Block Properties</h4>

          {/* Order */}
          <div>
            <label className="text-xs font-semibold text-gray-700">Order</label>
            <input
              type="number"
              value={editedBlock.order}
              onChange={(e) => handleFieldChange("order", parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
          </div>

          {/* Signing Party */}
          <div>
            <label className="text-xs font-semibold text-gray-700">Signing Party</label>
            <select
              value={editedBlock.signing_party_id}
              onChange={(e) => handleFieldChange("signing_party_id", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              <option value="">Select a party...</option>
              {signingParties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Block Type Specific Fields */}
        {(editedBlock.block_type === "header" || editedBlock.block_type === "paragraph") && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Content</h4>
            <div>
              <label className="text-xs font-semibold text-gray-700">Text Content</label>
              <textarea
                value={editedBlock.text_content || ""}
                onChange={(e) => handleFieldChange("text_content", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                placeholder="Enter text content..."
              />
            </div>
          </div>
        )}

        {/* Form Field Schema */}
        {editedBlock.block_type === "form_field" && editedBlock.field_schema && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Field Schema</h4>
            <div className="space-y-4 rounded border-l-4 border-blue-300 bg-blue-50 p-4">
              {/* Field Name */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Field Name</label>
                <input
                  type="text"
                  value={editedBlock.field_schema.field}
                  onChange={(e) => handleFieldSchemaChange("field", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              {/* Label */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Label</label>
                <input
                  type="text"
                  value={editedBlock.field_schema.label}
                  onChange={(e) => handleFieldSchemaChange("label", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Type</label>
                <select
                  value={editedBlock.field_schema.type}
                  onChange={(e) => handleFieldSchemaChange("type", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="text">Text</option>
                  <option value="signature">Signature</option>
                  <option value="date">Date</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Source</label>
                <select
                  value={editedBlock.field_schema.source}
                  onChange={(e) => handleFieldSchemaChange("source", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="user">User Input</option>
                  <option value="database">Database</option>
                  <option value="prefiller">Prefiller</option>
                </select>
              </div>

              {/* Tooltip */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Tooltip Label</label>
                <input
                  type="text"
                  value={editedBlock.field_schema.tooltip_label || ""}
                  onChange={(e) => handleFieldSchemaChange("tooltip_label", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              {/* Shared */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={editedBlock.field_schema.shared}
                    onChange={(e) => handleFieldSchemaChange("shared", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Shared Field
                </label>
              </div>

              {/* Validator */}
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Validator (Zod Schema)
                </label>
                <textarea
                  value={editedBlock.field_schema.validator || ""}
                  onChange={(e) => handleFieldSchemaChange("validator", e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900"
                  placeholder="e.g., z.string().min(1)"
                />
                <p className="mt-1 text-xs text-gray-500">Enter Zod validation schema as string</p>
              </div>

              {/* Prefiller */}
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Prefiller (JS Function)
                </label>
                <textarea
                  value={editedBlock.field_schema.prefiller || ""}
                  onChange={(e) => handleFieldSchemaChange("prefiller", e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900"
                  placeholder="e.g., ({ user }) => user.firstName"
                />
                <p className="mt-1 text-xs text-gray-500">Enter function logic to prefill value</p>
              </div>
            </div>
          </div>
        )}

        {/* Phantom Field Schema */}
        {editedBlock.block_type === "form_phantom_field" && editedBlock.phantom_field_schema && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Phantom Field Schema</h4>
            <div className="space-y-4 rounded border-l-4 border-amber-300 bg-amber-50 p-4">
              {/* Field Name */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Field Name</label>
                <input
                  type="text"
                  value={editedBlock.phantom_field_schema.field}
                  onChange={(e) => handlePhantomFieldSchemaChange("field", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              {/* Label */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Label</label>
                <input
                  type="text"
                  value={editedBlock.phantom_field_schema.label}
                  onChange={(e) => handlePhantomFieldSchemaChange("label", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Type</label>
                <select
                  value={editedBlock.phantom_field_schema.type}
                  onChange={(e) => handlePhantomFieldSchemaChange("type", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="text">Text</option>
                  <option value="signature">Signature</option>
                  <option value="date">Date</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Source</label>
                <select
                  value={editedBlock.phantom_field_schema.source}
                  onChange={(e) => handlePhantomFieldSchemaChange("source", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="user">User Input</option>
                  <option value="database">Database</option>
                  <option value="prefiller">Prefiller</option>
                </select>
              </div>

              {/* Tooltip */}
              <div>
                <label className="text-xs font-semibold text-gray-700">Tooltip Label</label>
                <input
                  type="text"
                  value={editedBlock.phantom_field_schema.tooltip_label || ""}
                  onChange={(e) => handlePhantomFieldSchemaChange("tooltip_label", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              {/* Shared */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={editedBlock.phantom_field_schema.shared}
                    onChange={(e) => handlePhantomFieldSchemaChange("shared", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Shared Field
                </label>
              </div>

              {/* Validator */}
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Validator (Zod Schema)
                </label>
                <textarea
                  value={editedBlock.phantom_field_schema.validator || ""}
                  onChange={(e) => handlePhantomFieldSchemaChange("validator", e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900"
                  placeholder="e.g., z.string().min(1)"
                />
                <p className="mt-1 text-xs text-gray-500">Enter Zod validation schema as string</p>
              </div>

              {/* Prefiller */}
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Prefiller (JS Function)
                </label>
                <textarea
                  value={editedBlock.phantom_field_schema.prefiller || ""}
                  onChange={(e) => handlePhantomFieldSchemaChange("prefiller", e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900"
                  placeholder="e.g., ({ user }) => user.firstName"
                />
                <p className="mt-1 text-xs text-gray-500">Enter function logic to prefill value</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Save/Cancel */}
      <div className="flex gap-2 border-t bg-gray-50 p-4">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
