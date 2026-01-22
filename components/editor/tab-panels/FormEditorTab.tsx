"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { IFormBlock } from "@betterinternship/core/forms";
import { PdfViewer } from "@/components/docs/form-editor/form-pdf-editor/PdfViewer";
import { FieldsPanel } from "./editor-components/FieldsPanel";
import { RevampedBlockEditor } from "./editor-components/RevampedBlockEditor";
import type { FormField } from "@/components/docs/form-editor/form-pdf-editor/FieldBox";

export function FormEditorTab() {
  const { formMetadata, updateBlocks } = useFormEditor();
  const [selectedPartyId, setSelectedPartyId] = useState<"all" | string>("all");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedParentGroup, setSelectedParentGroup] = useState<{
    fieldName: string;
    partyId: string;
    block_type: string;
    signing_party_id?: string;
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

  // Debounce sync to context (100ms delay) OR immediate for drag operations
  const handleFieldChange = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setFields((prevFields) =>
        prevFields.map((f) => (f._id === fieldId ? { ...f, ...updates } : f))
      );

      // Check if this is a drag operation (only x/y changed)
      const isDragOperation =
        (updates.x !== undefined || updates.y !== undefined) &&
        updates.w === undefined &&
        updates.h === undefined;

      if (isDragOperation) {
        // For drag operations, sync immediately to context (real-time coordinate updates)
        if (!formMetadata) return;

        isSyncingRef.current = true;

        const updatedBlocks = formMetadata.schema.blocks.map((block) => {
          if (block.block_type === "form_field" && block.field_schema && block._id === fieldId) {
            return {
              ...block,
              field_schema: {
                ...block.field_schema,
                x: updates.x !== undefined ? updates.x : block.field_schema.x,
                y: updates.y !== undefined ? updates.y : block.field_schema.y,
              },
            };
          }
          return block;
        });

        updateBlocks(updatedBlocks);

        setTimeout(() => {
          isSyncingRef.current = false;
        }, 50);
      } else {
        // For other operations (resize, etc), use debounce
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(syncFieldsToContext, 100);
      }
    },
    [formMetadata, updateBlocks, syncFieldsToContext]
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
      return block.signing_party_id === selectedPartyId;
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
        return schema?.field === group.fieldName && b.signing_party_id === group.partyId;
      });

      const schema = firstBlock?.field_schema || firstBlock?.phantom_field_schema;
      setSelectedParentGroup({
        ...group,
        block_type: firstBlock?.block_type || "form_field",
        signing_party_id: firstBlock?.signing_party_id,
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

  // Handle field selection from PDF - show block editor with coordinates
  const handleFieldSelectFromPdf = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedBlockId(fieldId); // Also set block ID so editor shows coordinates
    setSelectedParentGroup(null); // Clear parent group selection
  };

  // Handle new field creation - select it immediately to show in block editor
  const handleFieldCreate = (field: FormField) => {
    // First create the field in the form
    if (formMetadata) {
      const generateUniqueId = () =>
        `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uniqueId = generateUniqueId();
      // Assign to selected party if not "all"
      const signingPartyId = selectedPartyId !== "all" ? selectedPartyId : "";

      const newBlock: IFormBlock = {
        _id: uniqueId,
        block_type: "form_field",
        signing_party_id: signingPartyId,
        order: formMetadata.schema.blocks.length,
        field_schema: {
          field: field.label,
          label: field.label,
          type: (field.type as "text" | "signature" | "image") || "text",
          x: field.x || 0,
          y: field.y || 0,
          w: field.w || 100,
          h: field.h || 30,
          page: field.page || 1,
          tooltip_label: "",
          shared: true,
          source: "manual",
        },
      };
      updateBlocks([...formMetadata.schema.blocks, newBlock]);

      // Then select it in the editor
      setSelectedFieldId(uniqueId);
      setSelectedBlockId(uniqueId);
      setSelectedParentGroup(null);
    }
  };

  const handleParentUpdate = (group: { fieldName: string; partyId: string }, updates: any) => {
    // Apply updates to all blocks that match this parent group
    const updatedBlocks = formMetadata.schema.blocks.map((block) => {
      const schema = block.field_schema;

      const matches =
        schema?.field === group.fieldName &&
        (block.signing_party_id === group.partyId ||
          (block.signing_party_id === "" && group.partyId === "unknown") ||
          (block.signing_party_id === "unknown" && group.partyId === ""));

      if (matches) {
        const updated: IFormBlock = {
          ...block,
          field_schema: {
            ...schema,
            field: updates.fieldName !== undefined ? updates.fieldName : schema.field,
            label: updates.label !== undefined ? updates.label : schema.label,
            type: updates.type !== undefined ? updates.type : schema.type,
            source: updates.source !== undefined ? updates.source : schema.source,
            tooltip_label:
              updates.tooltip_label !== undefined ? updates.tooltip_label : schema.tooltip_label,
            shared: updates.shared !== undefined ? updates.shared : schema.shared,
            prefiller: updates.prefiller !== undefined ? updates.prefiller : schema.prefiller,
            validator: updates.validator !== undefined ? updates.validator : schema.validator,
          },
        };

        // Update block-level properties
        if (updates.block_type !== undefined) {
          updated.block_type = updates.block_type;
        }
        if (updates.signing_party_id !== undefined) {
          updated.signing_party_id = updates.signing_party_id;
        }

        return updated;
      }
      return block;
    });

    updateBlocks(updatedBlocks);
    setSelectedParentGroup((prev) =>
      prev
        ? {
            ...prev,
            ...updates,
            // If signing_party_id is updated, also update partyId to keep them in sync
            partyId:
              updates.signing_party_id !== undefined ? updates.signing_party_id : prev.partyId,
          }
        : null
    );
  };

  return (
    <div className="bg-background flex h-full w-full">
      {/* Left Panel - Fields List */}
      <div className="bg-card flex w-80 flex-col overflow-hidden border-r">
        <FieldsPanel
          blocks={formMetadata.schema.blocks}
          selectedPartyId={selectedPartyId}
          onPartyChange={setSelectedPartyId}
          onBlockSelect={handleBlockSelect}
          selectedBlockId={selectedBlockId}
          signingParties={formMetadata.signing_parties || []}
          onAddField={handleFieldCreate}
          onParentGroupSelect={handleParentGroupSelect}
        />
      </div>

      {/* Middle Panel - PDF Viewer */}
      <div className="flex-1 overflow-hidden border-r">
        <PdfViewer
          fields={fields}
          selectedFieldId={selectedFieldId || ""}
          onFieldSelect={handleFieldSelectFromPdf}
          onFieldChange={handleFieldChange}
          onFieldCreate={handleFieldCreate}
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
