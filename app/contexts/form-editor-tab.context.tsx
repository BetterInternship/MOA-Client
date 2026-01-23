"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { IFormBlock } from "@betterinternship/core/forms";
import { useFormEditor } from "./form-editor.context";
import type { FormField } from "@/components/docs/form-editor/form-pdf-editor/FieldBox";

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

  // Computed fields from formMetadata
  fields: FormField[];

  // Handlers
  handleFieldChange: (fieldId: string, updates: Partial<FormField>) => void;
  handleBlockSelect: (blockId: string) => void;
  handleParentGroupSelect: (group: { fieldName: string; partyId: string } | null) => void;
  handleBlockUpdate: (updatedBlock: IFormBlock) => void;
  handleFieldSelectFromPdf: (fieldId: string) => void;
  handleFieldCreate: (field: FormField) => void;
  handleParentUpdate: (group: { fieldName: string; partyId: string }, updates: any) => void;
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

  // Compute fields from formMetadata
  const fields: FormField[] =
    formMetadata?.schema.blocks
      ?.filter((block) => block.block_type === "form_field" && block.field_schema)
      .map((block) => {
        let signing_party_order = 1;
        if (block.signing_party_id && formMetadata.signing_parties) {
          const party = formMetadata.signing_parties.find((p) => p._id === block.signing_party_id);
          if (party) {
            signing_party_order = party.order;
          }
        }

        return {
          id: block._id,
          _id: block._id,
          field: block.field_schema?.field || "",
          label: block.field_schema?.label || "Field",
          type: block.field_schema?.type || "text",
          page: block.field_schema?.page || 1,
          x: block.field_schema?.x || 0,
          y: block.field_schema?.y || 0,
          w: block.field_schema?.w || 100,
          h: block.field_schema?.h || 12,
          signing_party_order,
        };
      }) || [];

  const handleFieldChange = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      if (!formMetadata) return;

      const updatedBlocks = formMetadata.schema.blocks.map((block) => {
        if (block.block_type === "form_field" && block.field_schema && block._id === fieldId) {
          return {
            ...block,
            field_schema: {
              ...block.field_schema,
              ...updates,
            },
          };
        }
        return block;
      });

      updateBlocks(updatedBlocks);
    },
    [formMetadata, updateBlocks]
  );

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

  const handleFieldSelectFromPdf = useCallback((fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedBlockId(fieldId);
    setSelectedParentGroup(null);
  }, []);

  const handleFieldCreate = useCallback(
    (field: FormField) => {
      if (!formMetadata) {
        console.error("[handleFieldCreate] formMetadata is undefined");
        return;
      }

      const generateUniqueId = () =>
        `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uniqueId = generateUniqueId();
      const signingPartyId = selectedPartyId || "";

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
          h: field.h || 12,
          page: field.page || 1,
          tooltip_label: "",
          shared: true,
          source: "manual",
        },
      };

      updateBlocks([...formMetadata.schema.blocks, newBlock]);
      setSelectedFieldId(uniqueId);
      setSelectedBlockId(uniqueId);
      setSelectedParentGroup(null);
    },
    [formMetadata, selectedPartyId, updateBlocks]
  );

  const handleParentUpdate = useCallback(
    (group: { fieldName: string; partyId: string }, updates: any) => {
      if (!formMetadata) return;

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
              partyId:
                updates.signing_party_id !== undefined ? updates.signing_party_id : prev.partyId,
            }
          : null
      );
    },
    [formMetadata, updateBlocks]
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
    fields,
    handleFieldChange,
    handleBlockSelect,
    handleParentGroupSelect,
    handleBlockUpdate,
    handleFieldSelectFromPdf,
    handleFieldCreate,
    handleParentUpdate,
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
