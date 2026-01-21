"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { IFormBlock, type IFormSigningParty } from "@betterinternship/core/forms";
import { PdfViewer } from "@/components/docs/form-editor/form-pdf-editor/PdfViewer";
import { FieldsPanel } from "./editor-components/FieldsPanel";
import { RevampedBlockEditor } from "./editor-components/RevampedBlockEditor";
import type { FormField } from "@/components/docs/form-editor/form-pdf-editor/FieldBox";

export function FormEditorTab() {
  const { formMetadata, updateBlocks } = useFormEditor();
  const [selectedPartyId, setSelectedPartyId] = useState<string | "all">("all");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedParentGroup, setSelectedParentGroup] = useState<{
    fieldName: string;
    partyId: string;
    label?: string;
    type?: string;
    source?: string;
    tooltip_label?: string;
    shared?: boolean;
    prefiller?: string;
    validator?: string;
  } | null>(null);

  // Local fields state for smooth dragging (syncs to context via debounce)
  const [fields, setFields] = useState<FormField[]>([]);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // Initialize fields from formMetadata
  useEffect(() => {
    // Don't reset local state if we're in the middle of syncing
    if (isSyncingRef.current) {
      return;
    }

    if (formMetadata?.schema.blocks) {
      const newFields = formMetadata.schema.blocks
        .filter((block) => block.block_type === "form_field" && block.field_schema)
        .map((block) => ({
          id: block._id,
          _id: block._id,
          field: block.field_schema?.field || "",
          label: block.field_schema?.label || "Field",
          type: block.field_schema?.type || "text",
          page: block.field_schema?.page || 1,
          x: block.field_schema?.x || 0,
          y: block.field_schema?.y || 0,
          w: block.field_schema?.w || 100,
          h: block.field_schema?.h || 30,
        }));
      setFields(newFields);
    }
  }, [formMetadata?.schema.blocks]);

  // Debounced sync from local fields state to context
  const syncFieldsToContext = useCallback(() => {
    if (!formMetadata) return;

    isSyncingRef.current = true;

    const updatedBlocks = formMetadata.schema.blocks.map((block) => {
      if (block.block_type === "form_field" && block.field_schema) {
        const updatedField = fields.find((f) => f._id === block._id);
        if (updatedField) {
          return {
            ...block,
            field_schema: {
              ...block.field_schema,
              x: updatedField.x,
              y: updatedField.y,
              w: updatedField.w,
              h: updatedField.h,
            },
          };
        }
      }
      return block;
    });

    updateBlocks(updatedBlocks);

    // Reset syncing flag after a brief delay to allow context update to settle
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 50);
  }, [formMetadata, fields, updateBlocks]);

  // Debounce sync to context (100ms delay)
  const handleFieldChange = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setFields((prevFields) =>
        prevFields.map((f) => (f._id === fieldId ? { ...f, ...updates } : f))
      );

      // Clear existing timeout and set new one
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(syncFieldsToContext, 100);
    },
    [syncFieldsToContext]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  if (!formMetadata) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        No form loaded
      </div>
    );
  }

  // Get filtered blocks based on selected party
  const filteredBlocks = useMemo(() => {
    if (selectedPartyId === "all") {
      return formMetadata.schema.blocks;
    }
    return formMetadata.schema.blocks.filter((block) => {
      const schema = block.field_schema;
      return schema?.signing_party_id === selectedPartyId;
    });
  }, [formMetadata.schema.blocks, selectedPartyId]);

  // Get selected block
  const selectedBlock = selectedBlockId
    ? formMetadata.schema.blocks.find((b) => b._id === selectedBlockId)
    : null;

  const handleBlockSelect = (blockId: string) => {
    setSelectedBlockId(blockId || null);
    // Clear parent group selection when a child is selected
    setSelectedParentGroup(null);
  };

  const handleParentGroupSelect = (group: { fieldName: string; partyId: string } | null) => {
    if (group) {
      // Get the first block of this group to extract all metadata fields
      const firstBlock = formMetadata?.schema.blocks.find((b) => {
        const schema = b.field_schema || b.phantom_field_schema;
        return schema?.field === group.fieldName && schema?.signing_party_id === group.partyId;
      });

      const schema = firstBlock?.field_schema || firstBlock?.phantom_field_schema;
      setSelectedParentGroup({
        ...group,
        label: schema?.label,
        type: schema?.type,
        source: schema?.source,
        tooltip_label: schema?.tooltip_label,
        shared: schema?.shared,
        prefiller: schema?.prefiller,
        validator: schema?.validator,
      });
    } else {
      setSelectedParentGroup(null);
    }
  };

  const handleBlockUpdate = (updatedBlock: IFormBlock) => {
    const updatedBlocks = formMetadata.schema.blocks.map((b) =>
      b._id === updatedBlock._id ? updatedBlock : b
    );
    updateBlocks(updatedBlocks);
  };

  const handleParentUpdate = (group: { fieldName: string; partyId: string }, updates: any) => {
    // Apply updates to all blocks that match this parent group
    const updatedBlocks = formMetadata.schema.blocks.map((block) => {
      const schema = block.field_schema;
      if (schema?.field === group.fieldName && schema?.signing_party_id === group.partyId) {
        return {
          ...block,
          field_schema: {
            ...block.field_schema,
            field: updates.fieldName !== undefined ? updates.fieldName : block.field_schema.field,
            label: updates.label !== undefined ? updates.label : block.field_schema.label,
            type: updates.type !== undefined ? updates.type : block.field_schema.type,
            source: updates.source !== undefined ? updates.source : block.field_schema.source,
            tooltip_label:
              updates.tooltip_label !== undefined
                ? updates.tooltip_label
                : block.field_schema.tooltip_label,
            shared: updates.shared !== undefined ? updates.shared : block.field_schema.shared,
            prefiller:
              updates.prefiller !== undefined ? updates.prefiller : block.field_schema.prefiller,
            validator:
              updates.validator !== undefined ? updates.validator : block.field_schema.validator,
          },
        };
      }
      return block;
    });

    updateBlocks(updatedBlocks);
    setSelectedParentGroup((prev) =>
      prev
        ? {
            ...prev,
            ...updates,
          }
        : null
    );
  };

  return (
    <div className="bg-background flex h-full w-full">
      {/* Left Panel - Fields List */}
      <div className="bg-card flex w-80 flex-col overflow-hidden border-r">
        <FieldsPanel
          blocks={filteredBlocks}
          selectedPartyId={selectedPartyId}
          onPartyChange={setSelectedPartyId}
          onBlockSelect={handleBlockSelect}
          selectedBlockId={selectedBlockId}
          signingParties={formMetadata.signing_parties || []}
          onAddField={() => {}}
          onParentGroupSelect={handleParentGroupSelect}
        />
      </div>

      {/* Middle Panel - PDF Viewer */}
      <div className="flex-1 overflow-hidden border-r">
        <PdfViewer
          fields={fields}
          selectedFieldId={selectedFieldId || ""}
          onFieldSelect={setSelectedFieldId}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* Right Panel - Block Editor */}
      <div className="bg-card flex w-96 flex-col overflow-hidden">
        <RevampedBlockEditor
          block={selectedBlock || null}
          onUpdate={handleBlockUpdate}
          signingParties={formMetadata.signing_parties || []}
          parentGroup={selectedParentGroup}
          onParentUpdate={handleParentUpdate}
        />
      </div>
    </div>
  );
}
