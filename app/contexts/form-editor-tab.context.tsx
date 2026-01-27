"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { IFormBlock } from "@betterinternship/core/forms";
import { useFormEditor } from "./form-editor.context";

interface BlockGroup {
  fieldName: string;
  partyId: string;
}

interface FormEditorTabContextType {
  // Selection state
  selectedPartyId: string | null;
  setSelectedPartyId: (partyId: string | null) => void;

  selectedBlockId: string | null;
  setSelectedBlockId: (blockId: string | null) => void;

  selectedFieldId: string | null;
  setSelectedFieldId: (fieldId: string | null) => void;

  // Record of block groups, keyed by blockId
  blockGroups: Record<string, BlockGroup>;
  setBlockGroups: (groups: Record<string, BlockGroup>) => void;

  // Currently selected group (for UI focus/editing)
  selectedBlockGroup: BlockGroup | null;
  setSelectedBlockGroup: (group: BlockGroup | null) => void;

  // Blocks directly
  blocks: IFormBlock[];

  // UI state - expanded groups, drag state, search
  expandedGroups: Set<string>;
  toggleExpandedGroup: (groupKey: string) => void;
  draggedGroupKey: string | null;
  setDraggedGroupKey: (key: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showPhantomMenu: boolean;
  setShowPhantomMenu: (show: boolean) => void;
  showLibrary: boolean;
  setShowLibrary: (show: boolean) => void;
  previewValues: Record<string, any>;
  setPreviewValues: (values: Record<string, any>) => void;
  previewErrors: Record<string, string>;
  setPreviewErrors: (errors: Record<string, string>) => void;

  // Handlers
  handleBlockSelect: (blockId: string) => void;
  handleParentGroupSelect: (blockId: string, group: BlockGroup | null) => void;
  handleBlockUpdate: (updatedBlock: IFormBlock) => void;
  handleBlockCreate: (block: IFormBlock) => void;
  handleFieldSelectFromPdf: (fieldId: string) => void;
  handleParentUpdate: (blockId: string, updates: any) => void;

  // Block management
  handleDuplicateBlock: (block: IFormBlock) => void;
  handleDeleteBlock: (blockId: string) => void;
  handleDeleteGroupBlocks: (fieldName: string, partyId: string) => void;
  handleReorderBlocks: (blocks: IFormBlock[]) => void;
  handleReorderBlock: (blockId: string, direction: "up" | "down") => void;
  handleAddPhantomBlock: (
    type: "header" | "paragraph" | "phantom_field",
    selectedPartyId: string,
    customBlock?: IFormBlock
  ) => void;
}

const FormEditorTabContext = createContext<FormEditorTabContextType | undefined>(undefined);

export function FormEditorTabProvider({ children }: { children: ReactNode }) {
  const { formMetadata, updateBlocks } = useFormEditor();

  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(
    formMetadata?.signing_parties?.[0]?._id || null
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [blockGroups, setBlockGroups] = useState<Record<string, BlockGroup>>({});
  const [selectedBlockGroup, setSelectedBlockGroup] = useState<BlockGroup | null>(null);

  // UI state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedGroupKey, setDraggedGroupKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPhantomMenu, setShowPhantomMenu] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});

  const toggleExpandedGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // Expose blocks directly from formMetadata
  const blocks = formMetadata?.schema.blocks || [];

  const handleBlockSelect = useCallback(
    (blockId: string) => {
      setSelectedBlockId(blockId || null);
      // Get the group for this block if it exists
      const group = blockGroups[blockId] || null;
      setSelectedBlockGroup(group);
    },
    [blockGroups]
  );

  const handleParentGroupSelect = useCallback((blockId: string, group: BlockGroup | null) => {
    if (group) {
      setBlockGroups((prev) => ({
        ...prev,
        [blockId]: group,
      }));
      setSelectedBlockGroup(group);
    } else {
      setBlockGroups((prev) => {
        const updated = { ...prev };
        delete updated[blockId];
        return updated;
      });
      setSelectedBlockGroup(null);
    }
  }, []);

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
      setSelectedBlockId(newBlock._id);
      setSelectedBlockGroup(null);
    },
    [formMetadata, updateBlocks]
  );

  const handleFieldSelectFromPdf = useCallback((fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedBlockId(fieldId);
    setSelectedBlockGroup(null);
  }, []);

  /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  const handleParentUpdate = useCallback(
    (blockId: string, updates: any) => {
      if (!formMetadata) return;

      const group = blockGroups[blockId];
      if (!group) return;

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
          // Handle text_content for phantom/header/paragraph blocks
          if (updates.text_content !== undefined) {
            updated.text_content = updates.text_content;
          }

          return updated;
        }
        return block;
      });

      updateBlocks(updatedBlocks);

      // Update the group mapping if partyId changed
      if (updates.signing_party_id !== undefined) {
        setBlockGroups((prev) => ({
          ...prev,
          [blockId]: {
            ...group,
            partyId: updates.signing_party_id,
          },
        }));
        // Also update the selected group if it matches
        setSelectedBlockGroup((prev) =>
          prev && prev.fieldName === group.fieldName && prev.partyId === group.partyId
            ? {
                ...prev,
                partyId: updates.signing_party_id,
              }
            : prev
        );
      }
    },
    [formMetadata, updateBlocks, blockGroups]
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
        return !(b.signing_party_id === partyId && schema?.field === fieldName);
      });
      updateBlocks(remainingBlocks);
    },
    [blocks, updateBlocks]
  );

  const handleReorderBlocks = useCallback(
    (reorderedBlocks: IFormBlock[]) => {
      // Ensure all blocks have proper order values
      const blocksWithOrder = reorderedBlocks.map((block, index) => ({
        ...block,
        order: index,
      }));
      updateBlocks(blocksWithOrder);
    },
    [updateBlocks]
  );

  const handleReorderBlock = useCallback(
    (blockId: string, direction: "up" | "down") => {
      const idx = blocks.findIndex((b) => b._id === blockId);
      if (idx === -1) return;

      const newBlocks = [...blocks];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;

      if (targetIdx < 0 || targetIdx >= newBlocks.length) return;

      [newBlocks[idx], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[idx]];
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks]
  );

  const handleAddPhantomBlock = useCallback(
    (
      type: "header" | "paragraph" | "phantom_field",
      selectedPartyId: string,
      customBlock?: IFormBlock
    ) => {
      let newBlock: IFormBlock;

      if (type === "phantom_field" && customBlock) {
        newBlock = customBlock;
      } else {
        newBlock = {
          _id: `${type}-${Date.now()}`,
        } as IFormBlock;
        newBlock.block_type = type;
        newBlock.signing_party_id = selectedPartyId;
        if (type === "header") {
          newBlock.text_content = "New Header";
        } else if (type === "paragraph") {
          newBlock.text_content = "New Paragraph";
        }
      }

      newBlock.order = blocks.length;
      updateBlocks([...blocks, newBlock]);
    },
    [blocks, updateBlocks]
  );

  const value: FormEditorTabContextType = {
    selectedPartyId,
    setSelectedPartyId,
    selectedBlockId,
    setSelectedBlockId,
    selectedFieldId,
    setSelectedFieldId,
    blockGroups,
    setBlockGroups,
    selectedBlockGroup,
    setSelectedBlockGroup,
    blocks,
    expandedGroups,
    toggleExpandedGroup,
    draggedGroupKey,
    setDraggedGroupKey,
    searchQuery,
    setSearchQuery,
    showPhantomMenu,
    setShowPhantomMenu,
    showLibrary,
    setShowLibrary,
    previewValues,
    setPreviewValues,
    previewErrors,
    setPreviewErrors,
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
    handleReorderBlock,
    handleAddPhantomBlock,
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
