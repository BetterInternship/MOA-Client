"use client";

import { IFormBlock, IFormSigningParty } from "@betterinternship/core/forms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Search as SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFieldTemplateContext } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { Input } from "@/components/ui/input";

interface FieldsPanelProps {
  blocks: IFormBlock[];
  selectedPartyId: string | "all";
  onPartyChange: (partyId: string | "all") => void;
  onBlockSelect: (blockId: string) => void;
  selectedBlockId: string | null;
  signingParties: IFormSigningParty[];
  onAddField: () => void;
}

// Color palette for signing parties
const getPartyColor = (index: number): string => {
  const colors = [
    "bg-blue-100 border-blue-300 text-blue-900",
    "bg-red-100 border-red-300 text-red-900",
    "bg-green-100 border-green-300 text-green-900",
    "bg-purple-100 border-purple-300 text-purple-900",
    "bg-yellow-100 border-yellow-300 text-yellow-900",
    "bg-pink-100 border-pink-300 text-pink-900",
  ];
  return colors[index % colors.length];
};

export function FieldsPanel({
  blocks,
  selectedPartyId,
  onPartyChange,
  onBlockSelect,
  selectedBlockId,
  signingParties,
  onAddField,
}: FieldsPanelProps) {
  const { registry } = useFieldTemplateContext();
  const [showLibrary, setShowLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Group blocks by field name and party
  const groupedFields = useMemo(() => {
    const groups: Record<
      string,
      {
        fieldName: string;
        partyId: string;
        partyName: string;
        instances: IFormBlock[];
      }
    > = {};

    blocks.forEach((block) => {
      const schema = block.field_schema || block.phantom_field_schema;
      if (!schema) return;

      const fieldName = schema.field || "Unnamed";
      const partyId = schema.signing_party_id || "unknown";
      const party = signingParties.find((p) => p._id === partyId);
      const partyName = party?.signatory_title || "Unknown Party";

      const key = `${fieldName}-${partyId}`;
      if (!groups[key]) {
        groups[key] = {
          fieldName,
          partyId,
          partyName,
          instances: [],
        };
      }
      groups[key].instances.push(block);
    });

    return Object.values(groups);
  }, [blocks, signingParties]);

  // Filter fields based on search
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return registry;
    const query = searchQuery.toLowerCase();
    return registry.filter(
      (field) =>
        field.name?.toLowerCase().includes(query) ||
        field.label?.toLowerCase().includes(query) ||
        field.description?.toLowerCase().includes(query)
    );
  }, [registry, searchQuery]);

  const handleDragStart = (e: React.DragEvent, fieldData: any) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("field", JSON.stringify(fieldData));
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-3 border-b p-4">
        {showLibrary ? (
          <>
            <Button
              onClick={() => {
                setShowLibrary(false);
                setSearchQuery("");
              }}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Fields
            </Button>

            {/* Search Bar */}
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Select value={selectedPartyId} onValueChange={onPartyChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select party..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {signingParties.map((party, idx) => (
                    <SelectItem key={party._id} value={party._id}>
                      <span className={`rounded px-2 py-1 text-sm ${getPartyColor(idx)}`}>
                        {party.signatory_title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setShowLibrary(true)}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {showLibrary ? (
          // Field Library
          <div className="space-y-3">
            {filteredFields.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">No fields found</p>
              </div>
            ) : (
              <>
                {filteredFields.map((field) => (
                  <Card
                    key={field.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, field)}
                    className="hover:border-primary/30 hover:bg-primary/5 cursor-move border-2 border-transparent p-3 transition-all hover:shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div>
                        <h4 className="text-foreground text-sm font-semibold">
                          {field.label || field.name}
                        </h4>
                        <p className="text-muted-foreground font-mono text-xs">{field.name}</p>
                      </div>

                      {field.description && (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {field.description}
                        </p>
                      )}

                      {/* Field Type Badge */}
                      {field.field_type && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                            {field.field_type}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                <div className="text-muted-foreground pt-2 text-center text-xs">
                  {filteredFields.length} field{filteredFields.length !== 1 ? "s" : ""} available
                </div>
              </>
            )}
          </div>
        ) : (
          // Fields List
          <div className="space-y-3">
            {groupedFields.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">
                No fields for this party
              </p>
            ) : (
              groupedFields.map((group) => {
                const partyIdx = signingParties.findIndex((p) => p._id === group.partyId);
                const partyColor = getPartyColor(partyIdx);

                return (
                  <div key={`${group.fieldName}-${group.partyId}`} className="space-y-2">
                    {/* Parent Card - Field Group */}
                    <Card
                      className={cn(
                        "cursor-pointer border p-3 transition-all",
                        partyColor,
                        "hover:shadow-md"
                      )}
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{group.fieldName}</h4>
                        <p className="text-xs opacity-75">{group.partyName}</p>
                        <p className="text-xs opacity-60">
                          {group.instances.length} instance
                          {group.instances.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Card>

                    {/* Child Cards - Instances */}
                    <div className="ml-2 space-y-2">
                      {group.instances.map((block, idx) => (
                        <Card
                          key={block._id}
                          onClick={() => onBlockSelect(block._id || "")}
                          className={cn(
                            "cursor-pointer border p-2 text-sm transition-all",
                            selectedBlockId === block._id
                              ? "ring-primary bg-primary/5 ring-2"
                              : "hover:bg-secondary/50"
                          )}
                        >
                          <p className="font-medium">Instance {idx + 1}</p>
                          <p className="text-muted-foreground text-xs">
                            Page{" "}
                            {(block.field_schema?.page || block.phantom_field_schema?.page || 0) +
                              1}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
