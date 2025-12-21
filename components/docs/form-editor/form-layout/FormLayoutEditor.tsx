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
import { FormPreview } from "./FormPreview";
import { ResizableSidebar, SidebarMenuItem } from "@/components/shared/resizable-sidebar";
import { FileText, Users, Mail, Eye } from "lucide-react";

// Utility to generate unique IDs for blocks
const generateBlockId = () => `block-${Math.random().toString(36).substr(2, 9)}`;

// Utility to ensure all blocks have IDs
const ensureBlockIds = (blocks: IFormBlock[]): IFormBlock[] => {
  return blocks.map((block) => ({
    ...block,
    _id: block._id || generateBlockId(),
  }));
};

interface FormLayoutEditorProps {
  formLabel: string;
  metadata: IFormMetadata;
  onMetadataChange?: (metadata: IFormMetadata) => void;
}

type SectionType = "tester" | "preview" | "parties" | "subscribers";

const MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: "tester",
    label: "Form Editor",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "preview",
    label: "Form Preview",
    icon: <Eye className="h-5 w-5" />,
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
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Initialize parties directly from metadata signing_parties
  const [parties, setParties] = useState<IFormSigningParty[]>(metadata.signing_parties);

  // Initialize subscribers directly from metadata
  const [subscribers, setSubscribers] = useState<IFormSubscriber[]>(metadata.subscribers);

  const [orderedBlocks, setOrderedBlocks] = useState<IFormBlock[]>(() => ensureBlockIds(blocks));

  // Sync parties and subscribers when metadata changes
  useEffect(() => {
    setParties(metadata.signing_parties);
    setSubscribers(metadata.subscribers);
  }, [metadata.signing_parties, metadata.subscribers]);

  const handleBlocksReorder = (newBlocks: IFormBlock[]) => {
    // Keep the same block selected by ID
    if (selectedBlockId) {
      const selectedBlockInNewList = newBlocks.find((b) => b._id === selectedBlockId);
      if (selectedBlockInNewList) {
        setSelectedBlock(selectedBlockInNewList);
      }
    }
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
    setSelectedBlockId(block._id || null);
  };

  const handleBlockUpdate = (updatedBlock: IFormBlock) => {
    const blockIndex = orderedBlocks.findIndex((b) => b._id === updatedBlock._id);
    if (blockIndex === -1) return;

    const newBlocks = [...orderedBlocks];
    newBlocks[blockIndex] = updatedBlock;
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
      _id: generateBlockId(),
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

  const handleDeleteBlock = (index: number) => {
    const newBlocks = orderedBlocks.filter((_, i) => i !== index);
    setOrderedBlocks(newBlocks);
    setSelectedBlockId(null);
    setSelectedBlock(null);
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: newBlocks,
      },
    });
  };

  const handleDuplicateBlock = (index: number) => {
    const blockToDuplicate = orderedBlocks[index];
    const duplicatedBlock: IFormBlock = {
      ...JSON.parse(JSON.stringify(blockToDuplicate)),
      _id: generateBlockId(), // Give the duplicate a new ID
    };
    const newBlocks = [
      ...orderedBlocks.slice(0, index + 1),
      duplicatedBlock,
      ...orderedBlocks.slice(index + 1),
    ];
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
    const selectedBlockIndex = selectedBlockId
      ? orderedBlocks.findIndex((b) => b._id === selectedBlockId)
      : null;

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
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            selectedBlockIndex={selectedBlockIndex}
          />
        );
      case "preview":
        return <FormPreview formName={formLabel} blocks={orderedBlocks} signingParties={parties} />;
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
                id: p._id || `party-${p.order}`,
                name: p._id,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
};
