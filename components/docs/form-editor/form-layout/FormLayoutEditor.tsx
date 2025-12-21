"use client";

import { useState } from "react";
import {
  type IFormBlock,
  type IFormMetadata,
  type IFormSigningParty,
} from "@betterinternship/core/forms";
import { EditableDynamicForm } from "./EditableDynamicForm";
import { BlockEditor } from "./BlockEditor";
import { PartiesPanel } from "./PartiesPanel";
import { ParametersPanel } from "./ParametersPanel";
import { SignatoriesPanel } from "./SignatoriesPanel";
import { ResizableSidebar, SidebarMenuItem } from "@/components/shared/resizable-sidebar";
import { FileText, Users, Settings, CheckCircle } from "lucide-react";

interface Parameter {
  id: string;
  key: string;
  value: string;
  type: "text" | "number" | "date";
  required: boolean;
}

interface Signatory {
  id: string;
  name: string;
  role: string;
  party: string;
  email?: string;
  signOrder: number;
}

interface FormLayoutEditorProps {
  blocks: IFormBlock[];
  formLabel: string;
  metadata: IFormMetadata;
  onBlocksReorder?: (reorderedBlocks: IFormBlock[]) => void;
}

type SectionType = "tester" | "fields" | "parties" | "parameters" | "signatories";

const MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: "tester",
    label: "Form Tester",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "parties",
    label: "Parties",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "parameters",
    label: "Parameters",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: "signatories",
    label: "Signatories",
    icon: <CheckCircle className="h-5 w-5" />,
  },
];

/**
 * Convert FormBlock to display-friendly structure
 * Renders all block types for editing and preview
 */
const formFieldToClientField = (field: string, label: string): any => {
  return {
    field,
    label,
    type: "text",
  };
};

export const FormLayoutEditor = ({
  blocks,
  formLabel,
  metadata,
  onBlocksReorder,
}: FormLayoutEditorProps) => {
  const [activeSection, setActiveSection] = useState<SectionType>("tester");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedBlock, setSelectedBlock] = useState<IFormBlock | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Initialize parties directly from metadata signing_parties
  const [parties, setParties] = useState<IFormSigningParty[]>(metadata.signing_parties);

  const [parameters, setParameters] = useState<Parameter[]>([
    {
      id: "1",
      key: "startDate",
      value: "",
      type: "date",
      required: true,
    },
    {
      id: "2",
      key: "endDate",
      value: "",
      type: "date",
      required: true,
    },
  ]);

  const [signatories, setSignatories] = useState<Signatory[]>([
    {
      id: "1",
      name: "Company Director",
      role: "Director",
      party: "entity",
      email: "",
      signOrder: 1,
    },
    {
      id: "2",
      name: "University Coordinator",
      role: "Coordinator",
      party: "university",
      email: "",
      signOrder: 2,
    },
  ]);

  const [orderedBlocks, setOrderedBlocks] = useState<IFormBlock[]>(blocks);

  const handleBlocksReorder = (newBlocks: IFormBlock[]) => {
    setOrderedBlocks(newBlocks);
    onBlocksReorder?.(newBlocks);
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
    onBlocksReorder?.(newBlocks);
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
            selectedBlockIndex={selectedBlockIndex}
          />
        );
      case "parties":
        return <PartiesPanel parties={parties} onPartiesChange={setParties} />;
      case "parameters":
        return <ParametersPanel parameters={parameters} onParametersChange={setParameters} />;
      case "signatories":
        return (
          <SignatoriesPanel
            signatories={signatories}
            parties={parties}
            onSignatoriesChange={setSignatories}
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
