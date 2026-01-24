"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { IFormBlock } from "@betterinternship/core/forms";
import { useFormEditor } from "./form-editor.context";

interface SelectedParentGroup {
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
}

interface FormEditorTabContextType {
  // Selection state
  selectedPartyId: string | null;
  setSelectedPartyId: (partyId: string | null) => void;

  selectedBlockId: string | null;
  setSelectedBlockId: (blockId: string | null) => void;

  selectedFieldId: string | null;
  setSelectedFieldId: (fieldId: string | null) => void;

  selectedParentGroup: SelectedParentGroup | null;
  setSelectedParentGroup: (group: SelectedParentGroup | null) => void;

  // Blocks directly
  blocks: IFormBlock[];

  // Handlers
  handleBlockSelect: (blockId: string) => void;
  handleParentGroupSelect: (group: { fieldName: string; partyId: string } | null) => void;
  handleBlockUpdate: (updatedBlock: IFormBlock) => void;
  handleBlockCreate: (block: IFormBlock) => void;
  handleFieldSelectFromPdf: (fieldId: string) => void;
  handleParentUpdate: (group: { fieldName: string; partyId: string }, updates: any) => void;

  // Block management
  handleDuplicateBlock: (block: IFormBlock) => void;
  handleDeleteBlock: (blockId: string) => void;
  handleDeleteGroupBlocks: (fieldName: string, partyId: string) => void;
  handleReorderBlocks: (blocks: IFormBlock[]) => void;
}

const FormEditorTabContext = createContext<FormEditorTabContextType | undefined>(undefined);

export function FormEditorTabProvider({ children }: { children: ReactNode }) {
  const { formMetadata, updateBlocks } = useFormEditor();

  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(
    formMetadata?.signing_parties?.[0]?._id || null
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedParentGroup, setSelectedParentGroup] = useState<SelectedParentGroup | null>(null);

  // Expose blocks directly from formMetadata
  const blocks = formMetadata?.schema.blocks || [];

  const handleBlockSelect = useCallback((blockId: string) => {
    setSelectedBlockId(blockId || null);
    setSelectedParentGroup(null);
  }, []);

  const handleParentGroupSelect = useCallback(
    (group: { fieldName: string; partyId: string } | null) => {
      if (group && formMetadata) {
        const firstBlock = formMetadata.schema.blocks.find((b) => {
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
    },
    [formMetadata]
  );

  const handleBlockUpdate = useCallback(
    (updatedBlock: IFormBlock) => {
      if (!formMetadata) return;
      const updatedBlocks = formMetadata.schema.blocks.map((b) =>
        b._id === updatedBlock._id ? updatedBlock : b
      );
      updateBlocks(updatedBlocks);
    },
    [formMetadata, updateBlocks]
  );

  const handleBlockCreate = useCallback(
    (newBlock: IFormBlock) => {
      if (!formMetadata) return;
      updateBlocks([...formMetadata.schema.blocks, newBlock]);
      setSelectedFieldId(newBlock._id);
      setSelectedBlockId(newBlock._id);
      setSelectedParentGroup(null);
    },
    [formMetadata, updateBlocks]
  );

  const handleFieldSelectFromPdf = useCallback((fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedBlockId(fieldId);
    setSelectedParentGroup(null);
  }, []);

  /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  const handleParentUpdate = useCallback(
    (group: { fieldName: string; partyId: string }, updates: any) => {
      if (!formMetadata) return;

      const updatedBlocks = formMetadata.schema.blocks.map((block: any) => {
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
      setSelectedParentGroup((prev: any) =>
        prev
          ? {
              ...prev,
              ...updates,
              partyId:
                updates.signing_party_id !== undefined ? updates.signing_party_id : prev.partyId,
            }
          : null
      );
    },
    [formMetadata, updateBlocks]
  );

  const handleDuplicateBlock = useCallback(
    (block: IFormBlock) => {
      const newBlock: IFormBlock = {
        ...block,
        _id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      updateBlocks([...blocks, newBlock]);
    },
    [blocks, updateBlocks]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      updateBlocks(blocks.filter((b) => b._id !== blockId));
    },
    [blocks, updateBlocks]
  );

  const handleDeleteGroupBlocks = useCallback(
    (fieldName: string, partyId: string) => {
      const remainingBlocks = blocks.filter((b) => {
        const schema = b.field_schema;
        return !(
          b.signing_party_id === partyId &&
          (schema?.field === fieldName || `${schema?.field}:${schema?.preset}` === fieldName)
        );
      });
      updateBlocks(remainingBlocks);
    },
    [blocks, updateBlocks]
  );

  const handleReorderBlocks = useCallback(
    (reorderedBlocks: IFormBlock[]) => {
      updateBlocks(reorderedBlocks);
    },
    [updateBlocks]
  );

  const value: FormEditorTabContextType = {
    selectedPartyId,
    setSelectedPartyId,
    selectedBlockId,
    setSelectedBlockId,
    selectedFieldId,
    setSelectedFieldId,
    selectedParentGroup,
    setSelectedParentGroup,
    blocks,
    handleBlockSelect,
    handleParentGroupSelect,
    handleBlockUpdate,
    handleBlockCreate,
    handleFieldSelectFromPdf,
    handleParentUpdate,
    handleDuplicateBlock,
    handleDeleteBlock,
    handleDeleteGroupBlocks,
    handleReorderBlocks,
  };

  return <FormEditorTabContext.Provider value={value}>{children}</FormEditorTabContext.Provider>;
}

export function useFormEditorTab() {
  const context = useContext(FormEditorTabContext);
  if (!context) {
    throw new Error("useFormEditorTab must be used within FormEditorTabProvider");
  }
  return context;
}
