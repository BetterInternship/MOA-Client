"use client";

import { useState, useEffect } from "react";
import {
  type IFormBlock,
  type IFormMetadata,
  type IFormSigningParty,
  type IFormSubscriber,
} from "@betterinternship/core/forms";
import { validateFieldWithZod } from "@/lib/form-validation";
import { EditableDynamicForm } from "./EditableDynamicForm";
import { PartiesPanel } from "./PartiesPanel";
import { SubscribersPanel } from "./SubscribersPanel";
import { FormPreview } from "./FormPreview";
import { FontConstantsPanel } from "./FontConstantsPanel";
import { ResizableSidebar, SidebarMenuItem } from "@/components/shared/resizable-sidebar";
import { FileText, Users, Mail, Eye, Palette } from "lucide-react";

// Utility to generate unique IDs for blocks
const generateBlockId = () => `block-${Math.random().toString(36).substr(2, 9)}`;

// Utility to ensure all blocks have IDs
const ensureBlockIds = (blocks: IFormBlock[]): IFormBlock[] => {
  return blocks.map((block) => ({
    ...block,
    _id: block._id || generateBlockId(),
  }));
};

// Utility to add order values based on array position
const addOrderToBlocks = (blocks: IFormBlock[]): IFormBlock[] => {
  return blocks.map((block, index) => ({
    ...block,
    order: index,
  }));
};

interface FormLayoutEditorProps {
  formLabel: string;
  metadata: IFormMetadata;
  documentUrl?: string;
  onMetadataChange?: (metadata: IFormMetadata) => void;
}

type SectionType = "tester" | "preview" | "parties" | "subscribers" | "fonts";

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
  {
    id: "fonts",
    label: "Font Constants",
    icon: <Palette className="h-5 w-5" />,
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize parties directly from metadata signing_parties
  const [parties, setParties] = useState<IFormSigningParty[]>(metadata.signing_parties ?? []);

  // Initialize subscribers directly from metadata
  const [subscribers, setSubscribers] = useState<IFormSubscriber[]>(
    Array.isArray(metadata.subscribers) ? metadata.subscribers : []
  );

  // Font overrides state
  const [overrideFonts, setOverrideFonts] = useState(false);
  const [textFont, setTextFont] = useState<string>("");
  const [signatureFont, setSignatureFont] = useState<string>("");

  const [orderedBlocks, setOrderedBlocks] = useState<IFormBlock[]>(() => ensureBlockIds(blocks));

  // Initialize font state from metadata
  useEffect(() => {
    const formFields = blocks.filter(
      (block) => block.block_type === "form_field" && block.field_schema
    );

    if (formFields.length > 0) {
      // Find a text field and a signature field to get their fonts
      let foundTextFont: string | undefined;
      let foundSignatureFont: string | undefined;

      for (const block of formFields) {
        const fieldSchema = (block as any).field_schema;
        if (fieldSchema?.font) {
          if (fieldSchema.type === "signature" && !foundSignatureFont) {
            foundSignatureFont = fieldSchema.font;
          } else if (fieldSchema.type !== "signature" && !foundTextFont) {
            foundTextFont = fieldSchema.font;
          }
        }
      }

      // If we found fonts, set them in state and enable override
      if (foundTextFont || foundSignatureFont) {
        if (foundTextFont) setTextFont(foundTextFont);
        if (foundSignatureFont) setSignatureFont(foundSignatureFont);
        // Only enable override if we found at least one font
        if (foundTextFont || foundSignatureFont) {
          setOverrideFonts(true);
        }
      }
    }
  }, []); // Run only once on mount

  // Sync parties and subscribers when metadata changes
  useEffect(() => {
    setParties(metadata.signing_parties ?? []);
    setSubscribers(Array.isArray(metadata.subscribers) ? metadata.subscribers : []);
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

    // Add order values based on array position
    const blocksWithOrder = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));

    // Update metadata with blocks that have proper order values
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: blocksWithOrder,
      },
    });
  };

  const handleBlockSelect = (block: IFormBlock, _blockIndex: number) => {
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

    // Add order values based on array position
    const blocksWithOrder = addOrderToBlocks(newBlocks);
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: blocksWithOrder,
      },
    });
  };

  const handleAddBlock = () => {
    const newBlock: IFormBlock = {
      _id: generateBlockId(),
      block_type: "header" as const,
      order: orderedBlocks.length,
      signing_party_id: "",
      text_content: "New Section",
    };
    const newBlocks = [...orderedBlocks, newBlock];
    setOrderedBlocks(newBlocks);

    // Add order values based on array position
    const blocksWithOrder = addOrderToBlocks(newBlocks);
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: blocksWithOrder,
      },
    });
  };

  const handleDeleteBlock = (index: number) => {
    const newBlocks = orderedBlocks.filter((_, i) => i !== index);
    setOrderedBlocks(newBlocks);
    setSelectedBlockId(null);
    setSelectedBlock(null);

    // Add order values based on array position
    const blocksWithOrder = addOrderToBlocks(newBlocks);
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: blocksWithOrder,
      },
    });
  };

  const handleDuplicateBlock = (index: number) => {
    const blockToDuplicate = orderedBlocks[index];
    const duplicatedBlock: IFormBlock = {
      ...(JSON.parse(JSON.stringify(blockToDuplicate)) as IFormBlock),
      _id: generateBlockId(), // Give the duplicate a new ID
    };
    const newBlocks = [
      ...orderedBlocks.slice(0, index + 1),
      duplicatedBlock,
      ...orderedBlocks.slice(index + 1),
    ];
    setOrderedBlocks(newBlocks);

    // Add order values based on array position
    const blocksWithOrder = addOrderToBlocks(newBlocks);
    onMetadataChange?.({
      ...metadata,
      schema: {
        ...metadata.schema,
        blocks: blocksWithOrder,
      },
    });
  };

  // Validate a field on blur using centralized validation
  const handleBlurValidate = (fieldKey: string) => {
    const value = formValues[fieldKey];
    const error = validateFieldWithZod(fieldKey, value, metadata);

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
  };

  // Filter blocks based on selected party
  const getFilteredBlocks = () => {
    return orderedBlocks;
  };

  const renderContent = () => {
    const selectedBlockIndex = selectedBlockId
      ? orderedBlocks.findIndex((b) => b._id === selectedBlockId)
      : null;

    switch (activeSection) {
      case "tester": {
        const filteredBlocks = getFilteredBlocks();
        return (
          <EditableDynamicForm
            formName={formLabel}
            blocks={filteredBlocks}
            values={formValues}
            onChange={(key: string, value: string) => {
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
            onBlockUpdate={handleBlockUpdate}
            selectedBlockIndex={selectedBlockIndex}
            selectedBlock={selectedBlock}
            signingParties={parties}
          />
        );
      }
      case "preview":
        return (
          <FormPreview
            formName={formLabel}
            blocks={orderedBlocks}
            signingParties={parties}
            documentUrl={documentUrl}
            metadata={metadata}
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
      case "fonts":
        return (
          <FontConstantsPanel
            overrideFonts={overrideFonts}
            onOverrideFontsChange={(override) => {
              setOverrideFonts(override);
              if (!override) {
                // Clear font overrides when disabled
                setTextFont("");
                setSignatureFont("");
              }
            }}
            textFont={textFont}
            onTextFontChange={setTextFont}
            signatureFont={signatureFont}
            onSignatureFontChange={setSignatureFont}
            onApplyFonts={(textF, sigF) => {
              // Update all fields with the selected fonts
              const updatedBlocks = blocks.map((block) => {
                if (block.block_type === "form_field" && block.field_schema) {
                  const fieldSchema = block.field_schema;
                  // Apply textFont to "text" type fields, sigFont to "signature" type fields, otherwise apply textFont as default
                  const fontToApply = fieldSchema.type === "signature" ? sigF : textF;

                  return {
                    ...block,
                    field_schema: {
                      ...fieldSchema,
                      font: fontToApply,
                    },
                  };
                }
                return block;
              });

              onMetadataChange?.({
                ...metadata,
                schema: {
                  ...metadata.schema,
                  blocks: updatedBlocks,
                },
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
        <div className="flex-1 overflow-hidden bg-white">
          <div className="h-full" data-section={activeSection}>
            {/* Section Content */}
            <div className={`h-full ${activeSection === "tester" ? "" : "overflow-auto p-4"}`}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
