"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

import { IFormBlock } from "@betterinternship/core/forms";
import { useState, useEffect } from "react";
import { useFormEditor } from "@/app/contexts/form-editor.context";
import { useFormEditorTab } from "@/app/contexts/form-editor-tab.context";
import {
  FormInput,
  FormTextarea,
  FormDropdown,
  FormCheckbox,
} from "@/components/docs/forms/EditForm";
import { Button } from "@/components/ui/button";
import {
  BiAlignLeft,
  BiAlignMiddle,
  BiAlignRight,
  BiVerticalBottom,
  BiVerticalCenter,
  BiVerticalTop,
} from "react-icons/bi";
import { BLOCK_TYPES, SOURCES } from "@betterinternship/core/forms";
import { ValidatorBuilder } from "@/components/docs/form-editor/ValidatorBuilder";
import { zodCodeToValidatorConfig, validatorConfigToZodCode } from "@/lib/validator-engine";

export function RevampedBlockEditor() {
  const { formMetadata } = useFormEditor();
  const { selectedBlockId, selectedBlockGroup, handleBlockUpdate, handleParentUpdate } =
    useFormEditorTab();

  // Get the selected block and parent group from context
  const block = selectedBlockId
    ? formMetadata?.schema.blocks?.find((b) => b._id === selectedBlockId) || null
    : null;
  const parentGroup = selectedBlockGroup;

  const [editedBlock, setEditedBlock] = useState<IFormBlock | null>(block);
  const [editedTextContent, setEditedTextContent] = useState<string>("");

  // Local state for immediate typing feedback - will sync back to formMetadata through handler
  // This allows responsive typing while formMetadata remains the authoritative source
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});

  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Update editedTextContent when selectedBlockGroup changes
  useEffect(() => {
    if (parentGroup) {
      const isHeaderOrParagraph =
        parentGroup.fieldName === "header" || parentGroup.fieldName === "paragraph";

      const matchingBlocks =
        formMetadata?.schema.blocks?.filter((b: any) => {
          // For headers/paragraphs, match by the group ID which is the block's _id
          if (isHeaderOrParagraph) {
            return (
              b._id === parentGroup.id &&
              (b.signing_party_id === parentGroup.partyId ||
                (b.signing_party_id === "" && parentGroup.partyId === "unknown") ||
                (b.signing_party_id === "unknown" && parentGroup.partyId === ""))
            );
          }

          // For form fields, match by field name and partyId
          return (
            (b.field_schema?.field === parentGroup.fieldName || b._id === parentGroup.fieldName) &&
            (b.signing_party_id === parentGroup.partyId ||
              (b.signing_party_id === "" && parentGroup.partyId === "unknown") ||
              (b.signing_party_id === "unknown" && parentGroup.partyId === ""))
          );
        }) || [];
      const firstBlock = matchingBlocks[0];
      if (firstBlock) {
        setEditedTextContent(firstBlock.text_content || "");
      }
    }
  }, [parentGroup, formMetadata?.schema.blocks]);

  // Clear editing values when parent group changes (formMetadata is now the source)
  useEffect(() => {
    setEditingValues({});
  }, [parentGroup?.id]);

  const handleFieldChange = (key: string, value: any) => {
    if (!editedBlock || !formMetadata) return;

    const schema = editedBlock.field_schema || editedBlock.phantom_field_schema;
    if (!schema) return;

    const updated = { ...editedBlock };

    if (
      key === "x" ||
      key === "y" ||
      key === "w" ||
      key === "h" ||
      key === "font_size" ||
      key === "text_wrapping" ||
      key === "horizontal_alignment" ||
      key === "vertical_alignment"
    ) {
      // PDF editor fields
      if (editedBlock.field_schema) {
        updated.field_schema = { ...editedBlock.field_schema, [key]: value };
      } else if (editedBlock.phantom_field_schema) {
        updated.phantom_field_schema = { ...editedBlock.phantom_field_schema, [key]: value };
      }
    } else {
      // Form editor fields
      if (editedBlock.field_schema) {
        updated.field_schema = { ...editedBlock.field_schema, [key]: value };
      } else if (editedBlock.phantom_field_schema) {
        updated.phantom_field_schema = { ...editedBlock.phantom_field_schema, [key]: value };
      }
    }

    // Update local state for immediate UI feedback
    setEditedBlock(updated);

    // Use context handler to update and sync
    handleBlockUpdate(updated);
  };

  if (!editedBlock && !parentGroup) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Select a field to edit</p>
      </div>
    );
  }

  // Handle parent group editing - Show form-level properties
  if (parentGroup && !editedBlock) {
    // Find a block that matches the fieldName and partyId to get its metadata
    const isHeaderOrParagraph =
      parentGroup.fieldName === "header" || parentGroup.fieldName === "paragraph";

    const matchingBlocks =
      formMetadata?.schema.blocks?.filter((b: any) => {
        // For headers/paragraphs, match by the group ID which is the block's _id
        if (isHeaderOrParagraph) {
          const matches =
            b._id === parentGroup.id &&
            (b.signing_party_id === parentGroup.partyId ||
              (b.signing_party_id === "" && parentGroup.partyId === "unknown") ||
              (b.signing_party_id === "unknown" && parentGroup.partyId === ""));
          return matches;
        }

        // For form fields, match by field name and partyId
        return (
          (b.field_schema?.field === parentGroup.fieldName ||
            b.phantom_field_schema?.field === parentGroup.fieldName ||
            b._id === parentGroup.fieldName) &&
          (b.signing_party_id === parentGroup.partyId ||
            (b.signing_party_id === "" && parentGroup.partyId === "unknown") ||
            (b.signing_party_id === "unknown" && parentGroup.partyId === ""))
        );
      }) || [];

    // Get the first matching block to extract metadata from
    const firstBlock = matchingBlocks[0];
    if (!firstBlock) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-muted-foreground text-sm">Block metadata not found</p>
        </div>
      );
    }

    const blockType = firstBlock.block_type || "form_field";
    const fieldMetadata = firstBlock.field_schema || firstBlock.phantom_field_schema;
    // Treat only header and paragraph as simple text-only blocks
    const isSimpleBlock = ["header", "paragraph"].includes(blockType);

    if (!fieldMetadata && !isSimpleBlock) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-muted-foreground text-sm">Field metadata not found</p>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card flex items-center justify-between border-b p-3.5">
          <div>
            <h3 className="text-sm font-semibold">Block Properties</h3>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-auto p-4">
          {/* Text Content - for header, paragraph, phantom_field */}
          {isSimpleBlock && (
            <FormTextarea
              label="Text Content"
              value={editedTextContent}
              setter={(value) => {
                setEditedTextContent(value);
                // For simple blocks, update all matching instances
                matchingBlocks.forEach((block) => {
                  handleBlockUpdate({ ...block, text_content: value });
                });
              }}
              placeholder={
                blockType === "header"
                  ? "Enter header text"
                  : blockType === "paragraph"
                    ? "Enter paragraph text"
                    : "Enter placeholder text"
              }
              required={false}
            />
          )}

          {/* Field Name - for form_field blocks */}
          {!isSimpleBlock && (
            <FormInput
              label="Field Name"
              value={
                editingValues.fieldName !== undefined
                  ? editingValues.fieldName
                  : fieldMetadata?.field || ""
              }
              setter={(value) => {
                // Immediate local state update for responsive typing
                setEditingValues((prev) => ({ ...prev, fieldName: value }));
                // Push to formMetadata - use parentGroup.id as the groupId
                if (parentGroup) {
                  handleParentUpdate(parentGroup.id, { fieldName: value });
                }
              }}
              placeholder="e.g., full_name"
              required={false}
            />
          )}

          {/* Block Type - always shown */}
          <FormDropdown
            label="Block Type"
            value={editingValues.blockType !== undefined ? editingValues.blockType : blockType}
            options={Array.from(
              new Set([
                ...BLOCK_TYPES,
                blockType, // always include the current blockType
              ])
            ).map((type) => ({
              id: type,
              name:
                type === "form_phantom_field"
                  ? "Form Phantom Field"
                  : type
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" "),
            }))}
            setter={(value) => {
              setEditingValues((prev) => ({ ...prev, blockType: value }));
              if (parentGroup) {
                handleParentUpdate(parentGroup.id, { block_type: value });
              }
            }}
            required={false}
          />

          {/* Signing Party - always shown */}
          <FormDropdown
            label="Signing Party"
            value={
              editingValues.signingPartyId !== undefined
                ? editingValues.signingPartyId
                : parentGroup.partyId
            }
            options={(formMetadata?.signing_parties || []).map((party, idx) => ({
              id: party._id,
              name: party.signatory_title || party._id,
              order: idx,
            }))}
            setter={(value) => {
              // Immediate local state update
              setEditingValues((prev) => ({ ...prev, signingPartyId: value }));
              // Push to formMetadata
              if (parentGroup) {
                handleParentUpdate(parentGroup.id, { signing_party_id: value });
              }
            }}
            required={false}
          />

          {/* Form field specific properties */}
          {!isSimpleBlock && fieldMetadata && (
            <>
              <FormInput
                label="Label"
                value={
                  editingValues.label !== undefined
                    ? editingValues.label
                    : fieldMetadata.label || ""
                }
                setter={(value) => {
                  console.log("[RevampedBlockEditor] Label changed:", {
                    value,
                    parentGroup,
                    selectedBlockId,
                  });
                  // Immediate local state update for responsive typing
                  setEditingValues((prev) => ({ ...prev, label: value }));
                  // Push to formMetadata - use parentGroup.id as the groupId
                  if (parentGroup) {
                    handleParentUpdate(parentGroup.id, { label: value });
                  }
                }}
                placeholder="Display label for users"
                required={false}
              />

              <FormDropdown
                label="Type"
                value={
                  editingValues.type !== undefined
                    ? editingValues.type
                    : fieldMetadata.type || "text"
                }
                options={[
                  { id: "text", name: "Text" },
                  { id: "signature", name: "Signature" },
                  { id: "date", name: "Date" },
                  { id: "number", name: "Number" },
                  { id: "checkbox", name: "Checkbox" },
                  { id: "select", name: "Select" },
                  { id: "textarea", name: "Textarea" },
                ]}
                setter={(value) => {
                  setEditingValues((prev) => ({ ...prev, type: value }));
                  if (parentGroup) {
                    handleParentUpdate(parentGroup.id, { type: value });
                  }
                }}
                required={false}
              />

              <FormDropdown
                label="Source"
                value={
                  editingValues.source !== undefined
                    ? editingValues.source
                    : fieldMetadata.source || "manual"
                }
                options={SOURCES.map((source) => ({
                  id: source,
                  name: source.charAt(0).toUpperCase() + source.slice(1),
                }))}
                setter={(value) => {
                  setEditingValues((prev) => ({ ...prev, source: value }));
                  if (parentGroup) {
                    handleParentUpdate(parentGroup.id, { source: value });
                  }
                }}
                required={false}
              />

              <FormTextarea
                label="Tooltip Label"
                value={
                  editingValues.tooltipLabel !== undefined
                    ? editingValues.tooltipLabel
                    : fieldMetadata.tooltip_label || ""
                }
                setter={(value) => {
                  setEditingValues((prev) => ({ ...prev, tooltipLabel: value }));
                  if (parentGroup) {
                    handleParentUpdate(parentGroup.id, { tooltip_label: value });
                  }
                }}
                placeholder="Help text for field"
                required={false}
              />

              <FormCheckbox
                label="Shared Field"
                checked={
                  editingValues.shared !== undefined
                    ? editingValues.shared
                    : fieldMetadata.shared || false
                }
                setter={(checked: boolean) => {
                  setEditingValues((prev) => ({ ...prev, shared: checked }));
                  if (parentGroup) {
                    handleParentUpdate(parentGroup.id, { shared: checked });
                  }
                }}
                required={false}
              />

              <div className="space-y-2">
                <h4 className="text-xs text-gray-600">Prefiller (JS Function)</h4>
                <FormTextarea
                  value={
                    editingValues.prefiller !== undefined
                      ? editingValues.prefiller
                      : fieldMetadata.prefiller || ""
                  }
                  setter={(value) => {
                    setEditingValues((prev) => ({ ...prev, prefiller: value }));
                    if (parentGroup) {
                      handleParentUpdate(parentGroup.id, { prefiller: value });
                    }
                  }}
                  placeholder="Optional JavaScript function to prefill this field"
                  required={false}
                />
              </div>

              <ValidatorBuilder
                config={
                  fieldMetadata.validator
                    ? zodCodeToValidatorConfig(fieldMetadata.validator)
                    : { rules: [] }
                }
                rawZodCode={fieldMetadata.validator || ""}
                onConfigChange={(newConfig) => {
                  const zodCode = validatorConfigToZodCode(newConfig);
                  if (parentGroup) {
                    handleParentUpdate(parentGroup.id, { validator: zodCode });
                  }
                }}
                onRawZodChange={(zodCode) => {
                  if (parentGroup) {
                    handleParentUpdate(parentGroup.id, { validator: zodCode });
                  }
                }}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  if (!editedBlock) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Select a field to edit</p>
      </div>
    );
  }

  const schema = (editedBlock.field_schema || editedBlock.phantom_field_schema) as any;

  // Child/Instance editing - Show PDF-level properties (coordinates, alignment, font size, wrap)
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card flex items-center justify-between border-b p-3.5">
        <div>
          <h3 className="text-sm font-semibold">Position & Layout</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Coordinates Section */}
        <div className="space-y-2">
          <h4 className="text-muted-foreground text-xs font-semibold">Coordinates</h4>
          <FormInput
            label="X"
            type="number"
            value={String((schema?.x || 0).toFixed(1))}
            setter={(value) => handleFieldChange("x", parseFloat(value))}
          />
          <FormInput
            label="Y"
            type="number"
            value={String((schema?.y || 0).toFixed(1))}
            setter={(value) => handleFieldChange("y", parseFloat(value))}
          />
        </div>

        {/* Size Section */}
        <div className="space-y-2">
          <h4 className="text-muted-foreground text-xs font-semibold">Size</h4>
          <FormInput
            label="Width"
            type="number"
            value={String((schema?.w || 100).toFixed(1))}
            setter={(value) => handleFieldChange("w", parseFloat(value))}
          />
          <FormInput
            label="Height"
            type="number"
            value={String((schema?.h || 20).toFixed(1))}
            setter={(value) => handleFieldChange("h", parseFloat(value))}
          />
        </div>

        {/* Typography Section */}
        <div className="space-y-2">
          <h4 className="text-muted-foreground text-xs font-semibold">Typography & Text</h4>
          <FormInput
            label="Font Size"
            type="number"
            value={String((schema?.font_size || 12).toFixed(1))}
            setter={(value) => handleFieldChange("font_size", parseFloat(value))}
          />
          <FormDropdown
            label="Text Wrapping"
            value={schema?.text_wrapping ? "wrap" : "no-wrap"}
            options={[
              { id: "no-wrap", name: "No Wrap" },
              { id: "wrap", name: "Wrap" },
            ]}
            setter={(value) => handleFieldChange("text_wrapping", value === "wrap")}
          />
        </div>

        {/* Alignment Section */}
        <div className="space-y-2">
          <h4 className="text-muted-foreground text-xs font-semibold">Alignment</h4>
          {/* Horizontal Alignment */}
          <div className="flex flex-1 gap-1">
            <Button
              size="sm"
              variant={schema?.horizontal_alignment === "left" ? "default" : "outline"}
              onClick={() => handleFieldChange("horizontal_alignment", "left")}
              title="Align Left"
              className="h-8 flex-1"
            >
              <BiAlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={schema?.horizontal_alignment === "center" ? "default" : "outline"}
              onClick={() => handleFieldChange("horizontal_alignment", "center")}
              title="Align Center"
              className="h-8 flex-1"
            >
              <BiAlignMiddle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={schema?.horizontal_alignment === "right" ? "default" : "outline"}
              onClick={() => handleFieldChange("horizontal_alignment", "right")}
              title="Align Right"
              className="h-8 flex-1"
            >
              <BiAlignRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Vertical Alignment */}
          <div className="flex flex-1 gap-1">
            <Button
              size="sm"
              variant={schema?.vertical_alignment === "top" ? "default" : "outline"}
              onClick={() => handleFieldChange("vertical_alignment", "top")}
              title="Align Top"
              className="h-8 flex-1"
            >
              <BiVerticalTop className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={schema?.vertical_alignment === "middle" ? "default" : "outline"}
              onClick={() => handleFieldChange("vertical_alignment", "middle")}
              title="Align Middle"
              className="h-8 flex-1"
            >
              <BiVerticalCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={schema?.vertical_alignment === "bottom" ? "default" : "outline"}
              onClick={() => handleFieldChange("vertical_alignment", "bottom")}
              title="Align Bottom"
              className="h-8 flex-1"
            >
              <BiVerticalBottom className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Text Options */}
        <div className="space-y-2"></div>
      </div>
    </div>
  );
}
