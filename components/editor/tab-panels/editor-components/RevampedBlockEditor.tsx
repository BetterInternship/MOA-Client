"use client";

import { IFormBlock, IFormSigningParty } from "@betterinternship/core/forms";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  FormInput,
  FormTextarea,
  FormDropdown,
  FormCheckbox,
} from "@/components/docs/forms/EditForm";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { BLOCK_TYPES } from "@betterinternship/core/forms";
import { capitalize } from "@/lib/string-utils";

interface RevampedBlockEditorProps {
  block: IFormBlock | null;
  onUpdate: (block: IFormBlock) => void;
  signingParties: IFormSigningParty[];
}

export function RevampedBlockEditor({ block, onUpdate, signingParties }: RevampedBlockEditorProps) {
  const [editedBlock, setEditedBlock] = useState<IFormBlock | null>(block);

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

  if (!editedBlock) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Select a field to edit</p>
      </div>
    );
  }

  const schema = editedBlock.field_schema || editedBlock.phantom_field_schema;
  const isPdfLevel = block !== editedBlock; // Check if editing PDF-level properties

  // Determine if this is a parent (all instances of same field) or child (single instance)
  const isParentLevel = !isPdfLevel;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card flex items-center justify-between border-b p-4">
        <div>
          <h3 className="text-sm font-semibold">
            {isParentLevel ? "Field Properties" : "Position & Layout"}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">{schema?.field || "Unnamed Field"}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {isParentLevel ? (
          // Form-level properties
          <>
            <FormInput
              label="Field Name"
              value={schema?.field || ""}
              onChange={(value) => handleFieldChange("field", value)}
              placeholder="e.g., full_name"
            />

            <FormInput
              label="Label"
              value={schema?.label || ""}
              onChange={(value) => handleFieldChange("label", value)}
              placeholder="Display label for users"
            />

            <FormDropdown
              label="Assigned To"
              value={schema?.signing_party_id || ""}
              onChange={(value) => handleFieldChange("signing_party_id", value)}
              options={signingParties.map((party) => ({
                value: party._id,
                label: party.signatory_title,
              }))}
            />

            <FormTextarea
              label="Tooltip"
              value={schema?.tooltip_label || ""}
              onChange={(value) => handleFieldChange("tooltip_label", value)}
              placeholder="Help text for field"
            />

            <FormDropdown
              label="Type"
              value={schema?.type || "text"}
              onChange={(value) => handleFieldChange("type", value)}
              options={[
                { value: "text", label: "Text" },
                { value: "signature", label: "Signature" },
                { value: "date", label: "Date" },
                { value: "number", label: "Number" },
                { value: "checkbox", label: "Checkbox" },
                { value: "select", label: "Select" },
                { value: "textarea", label: "Textarea" },
              ]}
            />

            <FormCheckbox
              label="Shared"
              checked={schema?.shared || false}
              onChange={(checked) => handleFieldChange("shared", checked)}
              description="Share this field across parties"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Zod Validator</label>
              <div className="bg-secondary/30 text-muted-foreground rounded-md border p-3 text-xs">
                <p>Validator configuration would go here</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prefill</label>
              <FormInput value={""} onChange={() => {}} placeholder="Prefill value" />
            </div>
          </>
        ) : (
          // PDF-level properties
          <>
            <FormInput
              label="X Position"
              type="number"
              value={schema?.x || 0}
              onChange={(value) => handleFieldChange("x", parseFloat(value))}
            />

            <FormInput
              label="Y Position"
              type="number"
              value={schema?.y || 0}
              onChange={(value) => handleFieldChange("y", parseFloat(value))}
            />

            <FormInput
              label="Width"
              type="number"
              value={schema?.w || 100}
              onChange={(value) => handleFieldChange("w", parseFloat(value))}
            />

            <FormInput
              label="Height"
              type="number"
              value={schema?.h || 20}
              onChange={(value) => handleFieldChange("h", parseFloat(value))}
            />

            <FormInput
              label="Font Size"
              type="number"
              value={schema?.font_size || 12}
              onChange={(value) => handleFieldChange("font_size", parseFloat(value))}
            />

            <FormCheckbox
              label="Text Wrapping"
              checked={schema?.text_wrapping || false}
              onChange={(checked) => handleFieldChange("text_wrapping", checked)}
            />

            <FormDropdown
              label="Horizontal Alignment"
              value={schema?.horizontal_alignment || "left"}
              onChange={(value) => handleFieldChange("horizontal_alignment", value)}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
            />

            <FormDropdown
              label="Vertical Alignment"
              value={schema?.vertical_alignment || "top"}
              onChange={(value) => handleFieldChange("vertical_alignment", value)}
              options={[
                { value: "top", label: "Top" },
                { value: "middle", label: "Middle" },
                { value: "bottom", label: "Bottom" },
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}
