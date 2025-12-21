"use client";

import { useState, useEffect } from "react";
import {
  type IFormBlock,
  type IFormMetadata,
  type IFormSigningParty,
  type IFormSubscriber,
} from "@betterinternship/core/forms";
import { EditableDynamicForm } from "./EditableDynamicForm";
import { BlockEditor } from "./BlockEditor";
import { PartiesPanel } from "./PartiesPanel";
import { SubscribersPanel } from "./SubscribersPanel";
import { ResizableSidebar, SidebarMenuItem } from "@/components/shared/resizable-sidebar";
import { FileText, Users, Mail } from "lucide-react";

interface FormLayoutEditorProps {
  formLabel: string;
  metadata: IFormMetadata;
  onMetadataChange?: (metadata: IFormMetadata) => void;
}

type SectionType = "tester" | "fields" | "parties" | "subscribers";

const MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: "tester",
    label: "Form Tester",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "parties",
    label: "Signing Parties",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "subscribers",
    label: "Subscribers",
    icon: <Mail className="h-5 w-5" />,
  },
];

export const FormLayoutEditor = ({
  formLabel,
  metadata,
  onMetadataChange,
}: FormLayoutEditorProps) => {
  // Get blocks from metadata.schema
  const blocks = metadata.schema.blocks;
  const [activeSection, setActiveSection] = useState<SectionType>("tester");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedBlock, setSelectedBlock] = useState<IFormBlock | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Initialize parties directly from metadata signing_parties
  const [parties, setParties] = useState<IFormSigningParty[]>(metadata.signing_parties);

  // Initialize subscribers directly from metadata
  const [subscribers, setSubscribers] = useState<IFormSubscriber[]>(metadata.subscribers);

  const [orderedBlocks, setOrderedBlocks] = useState<IFormBlock[]>(blocks);

  // Sync parties and subscribers when metadata changes
  useEffect(() => {
    setParties(metadata.signing_parties);
    setSubscribers(metadata.subscribers);
  }, [metadata.signing_parties, metadata.subscribers]);

  const handleBlocksReorder = (newBlocks: IFormBlock[]) => {
    setOrderedBlocks(newBlocks);
    // Update metadata with new blocks
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: newBlocks,
      },
    });
  };

  const handleBlockSelect = (block: IFormBlock, blockIndex: number) => {
    setSelectedBlock(block);
    setSelectedBlockIndex(blockIndex);
  };

  const handleBlockUpdate = (updatedBlock: IFormBlock) => {
    const newBlocks = [...orderedBlocks];
    newBlocks[selectedBlockIndex!] = updatedBlock;
    setOrderedBlocks(newBlocks);
    setSelectedBlock(updatedBlock);
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: newBlocks,
      },
    });
  };

  const handleAddBlock = () => {
    const newBlock: IFormBlock = {
      block_type: "header" as const,
      order: orderedBlocks.length,
      label: "New Block",
    };
    const newBlocks = [...orderedBlocks, newBlock];
    setOrderedBlocks(newBlocks);
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: newBlocks,
      },
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case "tester":
        return (
          <EditableDynamicForm
            formName={formLabel}
            blocks={orderedBlocks}
            values={formValues}
            onChange={(key, value) => {
              setFormValues((prev) => ({
                ...prev,
                [key]: value,
              }));
            }}
            onBlocksReorder={handleBlocksReorder}
            onBlockSelect={handleBlockSelect}
            onAddBlock={handleAddBlock}
            selectedBlockIndex={selectedBlockIndex}
          />
        );
      case "parties":
        return (
          <PartiesPanel
            parties={parties}
            onPartiesChange={(updatedParties) => {
              setParties(updatedParties);
              onMetadataChange?.({
                ...metadata,
                signing_parties: updatedParties,
              });
            }}
          />
        );

      case "subscribers":
        return (
          <SubscribersPanel
            subscribers={subscribers}
            onSubscribersChange={(updatedSubscribers) => {
              setSubscribers(updatedSubscribers);
              onMetadataChange?.({
                ...metadata,
                subscribers: updatedSubscribers,
              });
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-0 overflow-hidden">
      {/* Main Content with Sidebar */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Resizable Sidebar */}
        <ResizableSidebar
          items={MENU_ITEMS}
          activeItem={activeSection}
          onItemChange={(id) => setActiveSection(id as SectionType)}
          isResizable={false}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 pb-12">
            {/* Section Content */}
            <div className="space-y-4">{renderContent()}</div>
          </div>
        </div>

        {/* Right Sidebar - Block Editor (only in tester mode) */}
        {activeSection === "tester" && (
          <div className="flex w-80 flex-col border-l bg-gray-50">
            <BlockEditor
              block={selectedBlock}
              onClose={() => {
                setSelectedBlock(null);
                setSelectedBlockIndex(null);
              }}
              onUpdate={handleBlockUpdate}
              signingParties={parties.map((p) => ({
                id: p._id,
                name: p.signatory_source || `Party ${p.order}`,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
};
