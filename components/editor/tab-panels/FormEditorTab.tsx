"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";
import { useState, useMemo } from "react";
import { IFormBlock, type IFormSigningParty } from "@betterinternship/core/forms";
import { PdfViewer } from "@/components/docs/form-editor/form-pdf-editor/PdfViewer";
import { FieldsPanel } from "./editor-components/FieldsPanel";
import { RevampedBlockEditor } from "./editor-components/RevampedBlockEditor";

export function FormEditorTab() {
  const { formMetadata, updateFormMetadata } = useFormEditor();
  const [selectedPartyId, setSelectedPartyId] = useState<string | "all">("all");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

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
      const schema = block.field_schema || block.phantom_field_schema;
      return schema?.signing_party_id === selectedPartyId;
    });
  }, [formMetadata.schema.blocks, selectedPartyId]);

  // Get selected block
  const selectedBlock = selectedBlockId
    ? formMetadata.schema.blocks.find((b) => b._id === selectedBlockId)
    : null;

  const handleBlockUpdate = (updatedBlock: IFormBlock) => {
    const updatedBlocks = formMetadata.schema.blocks.map((b) =>
      b._id === updatedBlock._id ? updatedBlock : b
    );
    updateFormMetadata({ schema: { ...formMetadata.schema, blocks: updatedBlocks } });
  };

  const handleAddField = () => {
    // This will be handled by the FieldsPanel
  };

  return (
    <div className="bg-background flex h-full w-full">
      {/* Left Panel - Fields List */}
      <div className="bg-card flex w-80 flex-col overflow-hidden border-r">
        <FieldsPanel
          blocks={filteredBlocks}
          selectedPartyId={selectedPartyId}
          onPartyChange={setSelectedPartyId}
          onBlockSelect={setSelectedBlockId}
          selectedBlockId={selectedBlockId}
          signingParties={formMetadata.signing_parties || []}
          onAddField={handleAddField}
        />
      </div>

      {/* Middle Panel - PDF Viewer */}
      <div className="flex-1 overflow-hidden border-r">
        <PdfViewer />
      </div>

      {/* Right Panel - Block Editor */}
      <div className="bg-card flex w-96 flex-col overflow-hidden">
        <RevampedBlockEditor
          block={selectedBlock || null}
          onUpdate={handleBlockUpdate}
          signingParties={formMetadata.signing_parties || []}
        />
      </div>
    </div>
  );
}
