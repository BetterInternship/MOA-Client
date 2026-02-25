"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

import {
  IFormBlock,
  getFieldPresetTemplates,
} from "@betterinternship/core/forms";
import { useState, useEffect, useMemo } from "react";
import { useFormEditor } from "@/app/contexts/form-editor.context";
import { useFormEditorTab } from "@/app/contexts/form-editor-tab.context";
import { FormInput, FormTextarea, FormDropdown } from "@/components/docs/forms/EditForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BiAlignLeft,
  BiAlignMiddle,
  BiAlignRight,
  BiVerticalBottom,
  BiVerticalCenter,
  BiVerticalTop,
} from "react-icons/bi";
import { getPartyColorByIndex } from "@/lib/party-colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { DefaultValueSection } from "@/components/docs/form-editor/default-value.bundle";
import type { DefaultValueFieldOption } from "@/components/docs/form-editor/default-value.bundle";
import { ValidationSection } from "@/components/docs/form-editor/validation.bundle";
import { Switch } from "@/components/ui/switch";
import {
  applyPresetToSchema,
  findPresetByFieldKey,
  isDefaultPresetFieldKey,
} from "@/lib/default-field-preset-utils";

function RecipientBadgeDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; name: string; order?: number }[];
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.id === value) || options[0];
  const selectedColor = getPartyColorByIndex(Math.max(0, (selected?.order || 1) - 1));

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center justify-between rounded-[0.33em] border border-slate-300 bg-white px-2.5 text-sm"
        >
          <span
            className="max-w-[calc(100%-1.5rem)] truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: selectedColor.hex }}
          >
            {selected?.name || "Select recipient"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-[0.33em]"
      >
        {options.map((option) => {
          const color = getPartyColorByIndex(Math.max(0, (option.order || 1) - 1));
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onChange(option.id)}
              className="py-1.5"
            >
              <span
                className="max-w-full truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: color.hex }}
              >
                {option.name}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type FieldOption = DefaultValueFieldOption;

export function RevampedBlockEditor() {
  const { formMetadata } = useFormEditor();
  const {
    selectedBlockId,
    selectedBlockGroup,
    handleBlockUpdate,
    handleParentUpdate,
    editorViewMode,
  } = useFormEditorTab();

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

  const getSource = (schema: any) => (schema?.source as string) || "manual";
  const presetTemplates = useMemo(() => getFieldPresetTemplates(), []);
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

  const getFieldOptions = () => {
    const options: FieldOption[] = [];
    const seen = new Set<string>();
    const partyTitleById = new Map(
      (formMetadata?.signing_parties || []).map((party) => [
        party._id,
        party.signatory_title || party._id,
      ])
    );
    (formMetadata?.schema.blocks || []).forEach((candidate) => {
      const schema = candidate.field_schema || candidate.phantom_field_schema;
      const field = schema?.field;
      if (!field || seen.has(field)) return;

      seen.add(field);
      options.push({
        id: field,
        name: schema?.label || field,
        partyName: partyTitleById.get(candidate.signing_party_id || "") || undefined,
      });
    });
    return options.sort((a, b) => a.name.localeCompare(b.name));
  };

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
      key === "size" ||
      key === "wrap" ||
      key === "align_h" ||
      key === "align_v"
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

  const handleFieldPatch = (updates: Record<string, any>) => {
    if (!editedBlock || !formMetadata) return;

    const schema = editedBlock.field_schema || editedBlock.phantom_field_schema;
    if (!schema) return;

    const updated = { ...editedBlock };
    if (editedBlock.field_schema) {
      updated.field_schema = { ...editedBlock.field_schema, ...updates };
    } else if (editedBlock.phantom_field_schema) {
      updated.phantom_field_schema = { ...editedBlock.phantom_field_schema, ...updates };
    }

    setEditedBlock(updated);
    handleBlockUpdate(updated);
  };

  if (!editedBlock && !parentGroup) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Select a field to edit</p>
      </div>
    );
  }

  if (editorViewMode === "form" && editedBlock && !parentGroup) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">
          Select a row from Form View to edit settings
        </p>
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

    const parentSource =
      (editingValues.source !== undefined ? editingValues.source : fieldMetadata?.source) ||
      "manual";
    const isParentDerived = parentSource === "derived";
    const parentSchemaType =
      (editingValues.type !== undefined ? editingValues.type : fieldMetadata?.type) || "text";
    const parentPrefillerValue = (
      editingValues.prefiller !== undefined
        ? editingValues.prefiller
        : fieldMetadata?.prefiller || ""
    ) as string;
    const parentValidatorValue = (
      editingValues.validator !== undefined
        ? editingValues.validator
        : fieldMetadata?.validator || ""
    ) as string;
    const parentValidatorIrValue =
      editingValues.validator_ir !== undefined
        ? editingValues.validator_ir
        : (fieldMetadata as any)?.validator_ir || null;
    const parentFieldOptions = getFieldOptions();
    const parentFieldKey = String(fieldMetadata?.field || "");
    const isDefaultParentField = isDefaultPresetFieldKey(parentFieldKey, presetTemplates);
    const matchedParentPreset = findPresetByFieldKey(parentFieldKey, presetTemplates);

    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-auto p-3">
          <Card className="gap-2 p-2.5">
            <h4 className="text-muted-foreground text-xs font-semibold">Recipient</h4>
            <RecipientBadgeDropdown
              value={
                (editingValues.signingPartyId !== undefined
                  ? editingValues.signingPartyId
                  : parentGroup.partyId) || ""
              }
              options={(formMetadata?.signing_parties || []).map((party, idx) => ({
                id: party._id,
                name: party.signatory_title || party._id,
                order: idx + 1,
              }))}
              onChange={(value) => {
                setEditingValues((prev) => ({ ...prev, signingPartyId: value }));
                if (parentGroup) {
                  handleParentUpdate(parentGroup.id, { signing_party_id: value });
                }
              }}
            />
          </Card>

          {/* Text Content - for header, paragraph, phantom_field */}
          {isSimpleBlock && (
            <Card className="gap-2.5 p-2.5">
              <h4 className="text-muted-foreground text-xs font-semibold">Text content</h4>
              <FormTextarea
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
                className="min-h-28"
              />
            </Card>
          )}

          {/* Field settings */}
          {!isSimpleBlock && fieldMetadata && (
            <Card className="gap-2.5 p-2.5">
              <h4 className="text-muted-foreground text-xs font-semibold">Field settings</h4>
              <FormInput
                label="Field Label"
                value={
                  editingValues.fieldLabel !== undefined
                    ? editingValues.fieldLabel
                    : fieldMetadata.label || ""
                }
                setter={(value) => {
                  setEditingValues((prev) => ({ ...prev, fieldLabel: value }));
                  if (parentGroup) {
                    handleParentUpdate(parentGroup.id, { fieldLabel: value });
                  }
                }}
                placeholder="e.g., Full Name"
                required={false}
              />

              {isDefaultParentField && (
                <FormDropdown
                  label="Field Type"
                  value={matchedParentPreset?.id || ""}
                  options={presetOptions}
                  setter={(value) => {
                    const nextPreset = presetTemplates.find((preset) => preset.id === value);
                    if (!nextPreset || !parentGroup) return;
                    const presetPatch = applyPresetToSchema(fieldMetadata, nextPreset);
                    setEditingValues((prev) => ({
                      ...prev,
                      ...presetPatch,
                    }));
                    handleParentUpdate(parentGroup.id, presetPatch);
                  }}
                  required={false}
                />
              )}

              {isParentDerived ? (
                <>
                  <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-700">Default value</p>
                      <p className="text-[11px] text-slate-500">
                        Use default value mode for this field.
                      </p>
                    </div>
                    <Switch
                      checked={isParentDerived}
                      onCheckedChange={(checked) => {
                        const nextSource = checked ? "derived" : "manual";
                        setEditingValues((prev) => ({ ...prev, source: nextSource }));
                        if (parentGroup) handleParentUpdate(parentGroup.id, { source: nextSource });
                      }}
                    />
                  </div>
                  <DefaultValueSection
                    title="Default Values"
                    source={parentSource}
                    value={parentPrefillerValue}
                    fieldOptions={parentFieldOptions}
                    onChange={(value) => {
                      setEditingValues((prev) => ({ ...prev, prefiller: value }));
                      if (parentGroup) handleParentUpdate(parentGroup.id, { prefiller: value });
                    }}
                  />
                </>
              ) : (
                <>
                  <ValidationSection
                    validator={parentValidatorValue}
                    schemaType={parentSchemaType}
                    validatorIr={parentValidatorIrValue as any}
                    fieldOptions={parentFieldOptions}
                    onChange={(next) => {
                      setEditingValues((prev) => ({
                        ...prev,
                        validator: next.validator,
                        validator_ir: next.validator_ir,
                      }));
                      if (parentGroup)
                        handleParentUpdate(parentGroup.id, {
                          validator: next.validator,
                          validator_ir: next.validator_ir,
                        } as any);
                    }}
                  />
                  <DefaultValueSection
                    title="Placeholder"
                    source={parentSource}
                    value={parentPrefillerValue}
                    fieldOptions={parentFieldOptions}
                    onChange={(value) => {
                      setEditingValues((prev) => ({ ...prev, prefiller: value }));
                      if (parentGroup) handleParentUpdate(parentGroup.id, { prefiller: value });
                    }}
                  />
                  <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-700">Derived value</p>
                      <p className="text-[11px] text-slate-500">
                        Enable to compute this field from defaults.
                      </p>
                    </div>
                    <Switch
                      checked={isParentDerived}
                      onCheckedChange={(checked) => {
                        const nextSource = checked ? "derived" : "manual";
                        setEditingValues((prev) => ({ ...prev, source: nextSource }));
                        if (parentGroup) handleParentUpdate(parentGroup.id, { source: nextSource });
                      }}
                    />
                  </div>
                </>
              )}
            </Card>
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
  const childFieldOptions = getFieldOptions();
  const childSource = getSource(schema);
  const isChildDerived = childSource === "derived";
  const childFieldKey = String(schema?.field || "");
  const isDefaultChildField = isDefaultPresetFieldKey(childFieldKey, presetTemplates);
  const matchedChildPreset = findPresetByFieldKey(childFieldKey, presetTemplates);

  // Child/Instance editing - Show PDF-level properties (coordinates, alignment, font size, wrap)
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-auto p-3">
        <Card className="gap-2 p-2.5">
          <h4 className="text-muted-foreground text-xs font-semibold">Recipient</h4>
          <RecipientBadgeDropdown
            value={editedBlock.signing_party_id || ""}
            options={(formMetadata?.signing_parties || []).map((party, idx) => ({
              id: party._id,
              name: party.signatory_title || party._id,
              order: idx + 1,
            }))}
            onChange={(value) => {
              const updatedBlock = { ...editedBlock, signing_party_id: value };
              setEditedBlock(updatedBlock);
              handleBlockUpdate(updatedBlock);
            }}
          />
        </Card>

        <Card className="gap-2.5 p-2.5">
          <h4 className="text-muted-foreground text-xs font-semibold">Layout & Text</h4>
          <div className="grid grid-cols-2 gap-2">
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
          <div className="grid grid-cols-2 gap-2">
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
          <div className="grid grid-cols-[1fr_110px] items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-slate-600">Text wrap</p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={(schema?.wrap ?? true) ? "default" : "outline"}
                  onClick={() => handleFieldChange("wrap", true)}
                  title="Wrap"
                  className="h-8 flex-1"
                >
                  Wrap
                </Button>
                <Button
                  size="sm"
                  variant={(schema?.wrap ?? true) ? "outline" : "default"}
                  onClick={() => handleFieldChange("wrap", false)}
                  title="No wrap"
                  className="h-8 flex-1"
                >
                  No wrap
                </Button>
              </div>
            </div>
            <FormInput
              label="Font size"
              type="number"
              value={String((schema?.size || 12).toFixed(1))}
              setter={(value) => handleFieldChange("size", parseFloat(value))}
            />
          </div>
        </Card>

        <Card className="gap-2.5 p-2.5">
          <h4 className="text-muted-foreground text-xs font-semibold">Text Alignment</h4>
          <div className="space-y-1">
            <p className="text-xs text-slate-600">Horizontal</p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={
                  (schema?.align_h || schema?.horizontal_alignment) === "left"
                    ? "default"
                    : "outline"
                }
                onClick={() => handleFieldChange("align_h", "left")}
                title="Align Left"
                className="h-8 flex-1"
              >
                <BiAlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={
                  (schema?.align_h || schema?.horizontal_alignment) === "center"
                    ? "default"
                    : "outline"
                }
                onClick={() => handleFieldChange("align_h", "center")}
                title="Align Center"
                className="h-8 flex-1"
              >
                <BiAlignMiddle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={
                  (schema?.align_h || schema?.horizontal_alignment) === "right"
                    ? "default"
                    : "outline"
                }
                onClick={() => handleFieldChange("align_h", "right")}
                title="Align Right"
                className="h-8 flex-1"
              >
                <BiAlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-600">Vertical</p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={
                  (schema?.align_v || schema?.vertical_alignment) === "top" ? "default" : "outline"
                }
                onClick={() => handleFieldChange("align_v", "top")}
                title="Align Top"
                className="h-8 flex-1"
              >
                <BiVerticalTop className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={
                  (schema?.align_v || schema?.vertical_alignment) === "middle"
                    ? "default"
                    : "outline"
                }
                onClick={() => handleFieldChange("align_v", "middle")}
                title="Align Middle"
                className="h-8 flex-1"
              >
                <BiVerticalCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={
                  (schema?.align_v || schema?.vertical_alignment) === "bottom"
                    ? "default"
                    : "outline"
                }
                onClick={() => handleFieldChange("align_v", "bottom")}
                title="Align Bottom"
                className="h-8 flex-1"
              >
                <BiVerticalBottom className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <Card className="gap-2.5 p-2.5">
          <h4 className="text-muted-foreground text-xs font-semibold">Field settings</h4>
          <FormInput
            label="Field Label"
            value={schema?.label || ""}
            setter={(value) => handleFieldChange("label", value)}
            required={false}
          />
          {isDefaultChildField && (
            <FormDropdown
              label="Field Type"
              value={matchedChildPreset?.id || ""}
              options={presetOptions}
              setter={(value) => {
                const nextPreset = presetTemplates.find((preset) => preset.id === value);
                if (!nextPreset) return;
                const presetPatch = applyPresetToSchema(schema, nextPreset);
                handleFieldPatch(presetPatch);
              }}
              required={false}
            />
          )}
          {isChildDerived ? (
            <>
              <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700">Default value</p>
                  <p className="text-[11px] text-slate-500">
                    Use default value mode for this field.
                  </p>
                </div>
                <Switch
                  checked={isChildDerived}
                  onCheckedChange={(checked) =>
                    handleFieldChange("source", checked ? "derived" : "manual")
                  }
                />
              </div>
              <DefaultValueSection
                title="Default Values"
                source={childSource}
                value={(schema?.prefiller || "") as string}
                fieldOptions={childFieldOptions}
                onChange={(value) => handleFieldChange("prefiller", value)}
              />
            </>
          ) : (
            <>
              <ValidationSection
                validator={(schema?.validator || "") as string}
                schemaType={schema?.type}
                validatorIr={(schema?.validator_ir || null) as any}
                fieldOptions={childFieldOptions}
                onChange={(next) => {
                  handleFieldPatch({
                    validator: next.validator,
                    validator_ir: next.validator_ir,
                  });
                }}
              />
              <DefaultValueSection
                title="Placeholder"
                source={childSource}
                value={(schema?.prefiller || "") as string}
                fieldOptions={childFieldOptions}
                onChange={(value) => handleFieldChange("prefiller", value)}
              />
              <div className="flex items-center justify-between rounded-[0.33em] border border-slate-200 px-2.5 py-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700">Derived value</p>
                  <p className="text-[11px] text-slate-500">
                    Enable to compute this field from defaults.
                  </p>
                </div>
                <Switch
                  checked={isChildDerived}
                  onCheckedChange={(checked) =>
                    handleFieldChange("source", checked ? "derived" : "manual")
                  }
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

