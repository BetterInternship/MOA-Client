"use client";

import { useState, useEffect, useMemo } from "react";
import {
  type IFormBlock,
  type IFormField,
  type IFormPhantomField,
  BLOCK_TYPES,
} from "@betterinternship/core/forms";
import { useFieldTemplateContext } from "@/app/contexts/field-template.ctx";
import {
  FormInput,
  FormTextarea,
  FormDropdown,
  FormCheckbox,
} from "@/components/docs/forms/EditForm";
import { Button } from "@/components/ui/button";
import { capitalizeWords } from "@/lib/string-utils";
import { DefaultValueSection } from "@/components/docs/form-editor/default-value.bundle";
import { ValidationSection } from "@/components/docs/form-editor/validation.bundle";
import { Switch } from "@/components/ui/switch";
import {
  applyPresetToSchema,
  findPresetByFieldKey,
  isDefaultPresetFieldKey,
} from "@/lib/default-field-preset-utils";
import { resolveSystemPresetTemplates } from "@/lib/system-preset-resolver";

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
  const { registry } = useFieldTemplateContext();
  const presetTemplates = useMemo(
    () => resolveSystemPresetTemplates(registry as any[]),
    [registry]
  );
  const presetOptions = useMemo(
    () =>
      presetTemplates.map((preset) => ({
        id: preset.id,
        name:
          (preset.group || "core") === "format"
            ? `Format: ${preset.label || preset.name}`
            : preset.label || preset.name,
      })),
    [presetTemplates]
  );

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
            prefiller: currentSchema.prefiller || "",
            validator: currentSchema.validator || "",
            validator_ir: (currentSchema as any).validator_ir || null,
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
            prefiller: commonProps?.prefiller || "",
            validator: commonProps?.validator || "",
            validator_ir: commonProps?.validator_ir || null,
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
            prefiller: commonProps?.prefiller || "",
            validator: commonProps?.validator || "",
            validator_ir: commonProps?.validator_ir || null,
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

  const handleFieldSchemaPatch = (updates: Partial<IFormField>) => {
    if (editedBlock.block_type !== "form_field" || !editedBlock.field_schema) return;
    const updatedField = { ...editedBlock.field_schema, ...updates };
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

  const handlePhantomFieldSchemaPatch = (updates: Partial<IFormPhantomField>) => {
    if (editedBlock.block_type !== "form_phantom_field" || !editedBlock.phantom_field_schema)
      return;
    const updatedField = { ...editedBlock.phantom_field_schema, ...updates };
    const newBlock = { ...editedBlock, phantom_field_schema: updatedField };
    setEditedBlock(newBlock);
    onUpdate(newBlock);
  };

  const formFieldSchema = editedBlock.field_schema;
  const phantomFieldSchema = editedBlock.phantom_field_schema;
  const isFormFieldDerived = formFieldSchema?.source === "derived";
  const isFormFieldPrefill = formFieldSchema?.source === "prefill";
  const isFormFieldAuto = formFieldSchema?.source === "auto";
  const showFormValidation = !isFormFieldDerived && !isFormFieldPrefill && !isFormFieldAuto;
  const showFormPlaceholder = !isFormFieldDerived && !isFormFieldAuto;
  const isPhantomFieldDerived = phantomFieldSchema?.source === "derived";
  const isPhantomFieldPrefill = phantomFieldSchema?.source === "prefill";
  const isPhantomFieldAuto = phantomFieldSchema?.source === "auto";
  const showPhantomValidation =
    !isPhantomFieldDerived && !isPhantomFieldPrefill && !isPhantomFieldAuto;
  const showPhantomPlaceholder = !isPhantomFieldDerived && !isPhantomFieldAuto;
  const matchedFormFieldPreset = formFieldSchema
    ? findPresetByFieldKey(formFieldSchema.field, presetTemplates)
    : null;
  const matchedPhantomFieldPreset = phantomFieldSchema
    ? findPresetByFieldKey(phantomFieldSchema.field, presetTemplates)
    : null;
  const isDefaultFormField = formFieldSchema
    ? isDefaultPresetFieldKey(formFieldSchema.field, presetTemplates)
    : false;
  const isDefaultPhantomField = phantomFieldSchema
    ? isDefaultPresetFieldKey(phantomFieldSchema.field, presetTemplates)
    : false;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Content */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-2">
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

            {isDefaultFormField && (
              <FormDropdown
                label="Field Type"
                value={matchedFormFieldPreset?.id || ""}
                options={presetOptions}
                setter={(value) => {
                  const nextPreset = presetTemplates.find((preset) => preset.id === value);
                  if (!nextPreset) return;
                  const presetPatch = applyPresetToSchema(editedBlock.field_schema, nextPreset);
                  handleFieldSchemaPatch(presetPatch as Partial<IFormField>);
                }}
                required={false}
              />
            )}

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

            {isFormFieldDerived ? (
              <>
                <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700">Derived value</p>
                  </div>
                  <Switch
                    checked={Boolean(isFormFieldDerived)}
                    onCheckedChange={(checked) =>
                      handleFieldSchemaChange("source", checked ? "derived" : "manual")
                    }
                  />
                </div>
                <DefaultValueSection
                  title="Default Values"
                  source={editedBlock.field_schema.source}
                  value={editedBlock.field_schema.prefiller || ""}
                  fieldOptions={[]}
                  onChange={(val) => handleFieldSchemaChange("prefiller", val)}
                />
              </>
            ) : (
              <>
                {showFormValidation && (
                  <ValidationSection
                    schemaType={editedBlock.field_schema.type}
                    validator={editedBlock.field_schema.validator || ""}
                    validatorIr={(editedBlock.field_schema as any).validator_ir || null}
                    onChange={(next) => {
                      handleFieldSchemaPatch({
                        validator: next.validator,
                        validator_ir: next.validator_ir,
                      } as any);
                    }}
                  />
                )}
                {showFormPlaceholder && (
                  <div className="mt-4">
                    <DefaultValueSection
                      title="Placeholder"
                      source={editedBlock.field_schema.source}
                      value={editedBlock.field_schema.prefiller || ""}
                      fieldOptions={[]}
                      simpleMode="manual-only"
                      onChange={(val) => handleFieldSchemaChange("prefiller", val)}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                  <Switch
                    checked={Boolean(isFormFieldDerived)}
                    onCheckedChange={(checked) =>
                      handleFieldSchemaChange("source", checked ? "derived" : "manual")
                    }
                  />
                </div>
              </>
            )}
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

            {isDefaultPhantomField && (
              <FormDropdown
                label="Field Type"
                value={matchedPhantomFieldPreset?.id || ""}
                options={presetOptions}
                setter={(value) => {
                  const nextPreset = presetTemplates.find((preset) => preset.id === value);
                  if (!nextPreset) return;
                  const presetPatch = applyPresetToSchema(
                    editedBlock.phantom_field_schema,
                    nextPreset
                  );
                  handlePhantomFieldSchemaPatch(presetPatch as Partial<IFormPhantomField>);
                }}
                required={false}
              />
            )}

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

            {isPhantomFieldDerived ? (
              <>
                <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700">Derived value</p>
                  </div>
                  <Switch
                    checked={Boolean(isPhantomFieldDerived)}
                    onCheckedChange={(checked) =>
                      handlePhantomFieldSchemaChange("source", checked ? "derived" : "manual")
                    }
                  />
                </div>
                <DefaultValueSection
                  title="Default Values"
                  source={editedBlock.phantom_field_schema.source}
                  value={editedBlock.phantom_field_schema.prefiller || ""}
                  fieldOptions={[]}
                  onChange={(val) => handlePhantomFieldSchemaChange("prefiller", val)}
                />
              </>
            ) : (
              <>
                {showPhantomValidation && (
                  <ValidationSection
                    schemaType={editedBlock.phantom_field_schema.type}
                    validator={editedBlock.phantom_field_schema.validator || ""}
                    validatorIr={(editedBlock.phantom_field_schema as any).validator_ir || null}
                    onChange={(next) => {
                      handlePhantomFieldSchemaPatch({
                        validator: next.validator,
                        validator_ir: next.validator_ir,
                      } as any);
                    }}
                  />
                )}
                {showPhantomPlaceholder && (
                  <div className="mt-4">
                    <DefaultValueSection
                      title="Placeholder"
                      source={editedBlock.phantom_field_schema.source}
                      value={editedBlock.phantom_field_schema.prefiller || ""}
                      fieldOptions={[]}
                      simpleMode="manual-only"
                      onChange={(val) => handlePhantomFieldSchemaChange("prefiller", val)}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700">Derived value</p>
                  </div>
                  <Switch
                    checked={Boolean(isPhantomFieldDerived)}
                    onCheckedChange={(checked) =>
                      handlePhantomFieldSchemaChange("source", checked ? "derived" : "manual")
                    }
                  />
                </div>
              </>
            )}
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
