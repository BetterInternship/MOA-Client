"use client";

import { IFormBlock, IFormSigningParty } from "@betterinternship/core/forms";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  FormInput,
  FormTextarea,
  FormDropdown,
  FormCheckbox,
} from "@/components/docs/forms/EditForm";
import { Button } from "@/components/ui/button";
import { BiAlignLeft, BiAlignMiddle, BiAlignRight, BiVerticalBottom, BiVerticalCenter, BiVerticalTop } from "react-icons/bi";
import { BLOCK_TYPES } from "@betterinternship/core/forms";
import { capitalize } from "@/lib/string-utils";
import { ValidatorBuilder } from "@/components/docs/form-editor/ValidatorBuilder";
import { zodCodeToValidatorConfig, validatorConfigToZodCode } from "@/lib/validator-engine";

interface RevampedBlockEditorProps {
  block: IFormBlock | null;
  onUpdate: (block: IFormBlock) => void;
  signingParties: IFormSigningParty[];
  parentGroup?: { fieldName: string; partyId: string } | null;
  onParentUpdate?: (group: { fieldName: string; partyId: string }, updates: any) => void;
}

export function RevampedBlockEditor({
  block,
  onUpdate,
  signingParties,
  parentGroup,
  onParentUpdate,
}: RevampedBlockEditorProps) {
  const [editedBlock, setEditedBlock] = useState<IFormBlock | null>(block);

  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  const handleFieldChange = (key: string, value: any) => {
    if (!editedBlock) return;

    const schema = editedBlock.field_schema || editedBlock.phantom_field_schema;
    if (!schema) return;

    let updated = { ...editedBlock };

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

    setEditedBlock(updated);
    onUpdate(updated);
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
    const label = (parentGroup as any).label || "";
    const fieldType = (parentGroup as any).type || "text";
    const source = (parentGroup as any).source || "manual";
    const tooltipLabel = (parentGroup as any).tooltip_label || "";
    const shared = (parentGroup as any).shared || false;
    const prefiller = (parentGroup as any).prefiller || "";
    const validator = (parentGroup as any).validator || "";

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card flex items-center justify-between border-b p-3.5">
          <div>
            <h3 className="text-sm font-semibold">Field Metadata</h3>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-auto p-4">
   

          <FormInput
            label="Field Name"
            value={parentGroup.fieldName || ""}
            setter={(value) => {
              onParentUpdate?.(parentGroup, { fieldName: value });
            }}
            placeholder="e.g., full_name"
          />

          <FormInput
            label="Label"
            value={label}
            setter={(value) => {
              onParentUpdate?.(parentGroup, { label: value });
            }}
            placeholder="Display label for users"
          />

          <FormDropdown
            label="Type"
            value={fieldType}
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
              onParentUpdate?.(parentGroup, { type: value });
            }}
          />

          <FormDropdown
            label="Source"
            value={source}
            options={[
              { id: "manual", name: "Manual" },
              { id: "database", name: "Database" },
              { id: "api", name: "API" },
            ]}
            setter={(value) => {
              onParentUpdate?.(parentGroup, { source: value });
            }}
          />

          <FormInput
            label="Tooltip Label"
            value={tooltipLabel}
            setter={(value) => {
              onParentUpdate?.(parentGroup, { tooltip_label: value });
            }}
            placeholder="Help text for field"
          />

          <FormCheckbox
            label="Shared Field"
            checked={shared}
            setter={(checked) => {
              onParentUpdate?.(parentGroup, { shared: checked });
            }}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Prefiller (JS Function)</label>
            <FormTextarea
              value={prefiller}
              setter={(value) => {
                onParentUpdate?.(parentGroup, { prefiller: value });
              }}
              placeholder="Optional JavaScript function to prefill this field"
            />
          </div>

          <ValidatorBuilder
            config={
              validator ? zodCodeToValidatorConfig(validator) : { rules: [] }
            }
            rawZodCode={validator}
            onConfigChange={(newConfig) => {
              const zodCode = validatorConfigToZodCode(newConfig);
              onParentUpdate?.(parentGroup, { validator: zodCode });
            }}
            onRawZodChange={(zodCode) => {
              onParentUpdate?.(parentGroup, { validator: zodCode });
            }}
          />
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

  const schema = editedBlock.field_schema || editedBlock.phantom_field_schema;

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
          <h4 className="text-xs font-semibold text-muted-foreground">Coordinates</h4>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="X"
              value={String((schema?.x || 0).toFixed(1))}
              setter={(value) => handleFieldChange("x", parseFloat(value))}
            />
            <FormInput
              label="Y"
              value={String((schema?.y || 0).toFixed(1))}
              setter={(value) => handleFieldChange("y", parseFloat(value))}
            />
          </div>
        </div>

        {/* Size Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Size</h4>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Width"
              value={String((schema?.w || 100).toFixed(1))}
              setter={(value) => handleFieldChange("w", parseFloat(value))}
            />
            <FormInput
              label="Height"
              value={String((schema?.h || 20).toFixed(1))}
              setter={(value) => handleFieldChange("h", parseFloat(value))}
            />
          </div>
        </div>

        {/* Typography Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Typography & Text</h4>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Font Size"
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
        </div>

        {/* Alignment Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Alignment</h4>
          <div className="flex gap-2">
            {/* Horizontal Alignment */}
            <div className="flex gap-1 flex-1">
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
            <div className="flex gap-1 flex-1">
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
        </div>

        {/* Text Options */}
        <div className="space-y-2">
        </div>
      </div>
    </div>
  );
