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
  documentUrl?: string;
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
  documentUrl,
  onMetadataChange,
}: FormLayoutEditorProps) => {
  // Get blocks from metadata.schema
  const blocks = metadata.schema.blocks;
  const [activeSection, setActiveSection] = useState<SectionType>("tester");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedBlock, setSelectedBlock] = useState<IFormBlock | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [filterPartyId, setFilterPartyId] = useState<string | null>("all");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  // Validate a field on blur
  const handleBlurValidate = (fieldKey: string) => {
    // Find the field in blocks to get its validator
    const fieldBlock = orderedBlocks.find((block) => {
      if (block.block_type === "form_field" && block.field_schema) {
        return block.field_schema.field === fieldKey;
      }
      if (block.block_type === "form_phantom_field" && block.phantom_field_schema) {
        return block.phantom_field_schema.field === fieldKey;
      }
      return false;
    });

    if (!fieldBlock) return;

    // Get the validator string from the field schema
    let validatorString = "";
    if (fieldBlock.block_type === "form_field" && fieldBlock.field_schema) {
      validatorString = fieldBlock.field_schema.validator || "";
    } else if (fieldBlock.block_type === "form_phantom_field" && fieldBlock.phantom_field_schema) {
      validatorString = fieldBlock.phantom_field_schema.validator || "";
    }

    // If no validator, clear any existing error
    if (!validatorString) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
      return;
    }

    // Try to validate using the zod schema string
    try {
      const value = formValues[fieldKey];

      // Simple validation logic - can be extended
      // For now, we'll do basic checks based on common patterns
      let error = "";

      if (validatorString.includes("min(1)") || validatorString.includes("required")) {
        if (!value || value.trim() === "") {
          error = "This field is required";
        }
      }

      if (validatorString.includes("email")) {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Invalid email address";
        }
      }

      if (error) {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldKey]: error,
        }));
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldKey];
          return newErrors;
        });
      }
    } catch (err) {
      // If validator parsing fails, clear any existing error
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  // Filter blocks based on selected party
  const getFilteredBlocks = () => {
    if (filterPartyId === "all") {
      return orderedBlocks;
    }
    return orderedBlocks.filter((block) => block.signing_party_id === filterPartyId);
  };

  const renderContent = () => {
    const selectedBlockIndex = selectedBlockId
      ? orderedBlocks.findIndex((b) => b._id === selectedBlockId)
      : null;

    switch (activeSection) {
      case "tester":
        const filteredBlocks = getFilteredBlocks();
        return (
          <div className="space-y-4">
            {/* Party Filter */}
            <div className="rounded border border-slate-200 bg-white p-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Filter by Party</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterPartyId("all")}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      filterPartyId === "all"
                        ? "bg-blue-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    All Fields
                  </button>
                  {parties.map((party) => (
                    <button
                      key={party._id}
                      onClick={() => setFilterPartyId(party._id)}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        filterPartyId === party._id
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {party.signatory_account?.name || party._id}
                      <span className="ml-2 text-xs opacity-75">({party.order})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Editable Form */}
            <EditableDynamicForm
              formName={formLabel}
              blocks={filteredBlocks}
              values={formValues}
              onChange={(key, value) => {
                setFormValues((prev) => ({
                  ...prev,
                  [key]: value,
                }));
              }}
              errors={validationErrors}
              onBlurValidate={handleBlurValidate}
              onBlocksReorder={handleBlocksReorder}
              onBlockSelect={handleBlockSelect}
              onAddBlock={handleAddBlock}
              onDeleteBlock={handleDeleteBlock}
              onDuplicateBlock={handleDuplicateBlock}
              selectedBlockIndex={selectedBlockIndex}
            />
          </div>
        );
      case "preview":
        return (
          <FormPreview
            formName={formLabel}
            blocks={orderedBlocks}
            signingParties={parties}
            documentUrl={documentUrl}
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
