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
import { Badge } from "@/components/ui/badge";

interface FieldsPanelProps {
  blocks: IFormBlock[];
  selectedPartyId: "all" | string;
  onPartyChange: (partyId: "all" | string) => void;
  onBlockSelect: (blockId: string) => void;
  selectedBlockId: string | null;
  signingParties: IFormSigningParty[];
  onAddField: (field: IFormBlock) => void;
  onParentGroupSelect?: (group: { fieldName: string; partyId: string } | null) => void;
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
  onAddField: _onAddField,
  onParentGroupSelect,
}: FieldsPanelProps) {
  const { registry } = useFieldTemplateContext();
  const [showLibrary, setShowLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpanded = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

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
      const schema = block.field_schema;
      if (!schema) return;

      const fieldName = schema.field || "Unnamed";
      const partyId = block.signing_party_id || "unknown";
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

    // Filter by selected party
    const allGroups = Object.values(groups);
    if (selectedPartyId === "all") {
      return allGroups;
    }
    const filtered = allGroups.filter((group) => group.partyId === selectedPartyId);
    return filtered;
  }, [blocks, signingParties, selectedPartyId]);

  // Filter fields based on search
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return registry;
    const query = searchQuery.toLowerCase();
    return registry.filter(
      (field) =>
        field.name?.toLowerCase().includes(query) || field.label?.toLowerCase().includes(query)
    );
  }, [registry, searchQuery]);

  const handleDragStart = (e: React.DragEvent, fieldData: any) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("field", JSON.stringify(fieldData));
  };

  const handleFieldAdd = (field: any) => {
    _onAddField(field);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Persistent Header - Party Selection & Add Button */}
      <div className="space-y-3 border-b p-4">
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
          onClick={() => setShowLibrary(!showLibrary)}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          {showLibrary ? <ArrowLeft className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showLibrary ? "Back to Fields" : "Add Field"}
        </Button>
      </div>

      {/* Content - Switches between library and fields list */}
      <div className="flex-1 overflow-auto p-4">
        {showLibrary ? (
          // Field Library
          <div className="space-y-3">
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
                    onClick={() => handleFieldAdd(field)}
                    className="hover:border-primary/30 hover:bg-primary/5 cursor-move border-2 border-transparent p-3 transition-all hover:shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div>
                        <h4 className="text-foreground text-sm font-semibold">
                          {field.label || field.name}
                        </h4>
                        <p className="text-muted-foreground font-mono text-xs">{field.name}</p>
                      </div>
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
                const groupKey = `${group.fieldName}-${group.partyId}`;
                const isExpanded = expandedGroups.has(groupKey);

                return (
                  <div key={groupKey} className="space-y-2">
                    {/* Parent Card - Field Group */}
                    <Card
                      onClick={() => {
                        onBlockSelect("");
                        onParentGroupSelect?.({
                          fieldName: group.fieldName,
                          partyId: group.partyId,
                        });
                        toggleGroupExpanded(groupKey);
                      }}
                      className={cn(
                        "border-l-primary/60 bg-muted/30 cursor-pointer border border-l-4 p-2 transition-all hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold">{group.fieldName}</h4>
                          <p className="text-muted-foreground truncate text-xs">
                            {group.partyName}
                          </p>
                        </div>
                        <Badge type="default" className="flex-shrink-0 text-xs">
                          {group.instances.length}
                        </Badge>
                      </div>
                    </Card>

                    {/* Child Cards - Instances */}
                    {isExpanded && (
                      <div className="ml-4 space-y-1 border-l-2 pl-3">
                        {group.instances.map((block) => {
                          const x = Math.round(block.field_schema?.x || 0);
                          const y = Math.round(block.field_schema?.y || 0);
                          const page = (block.field_schema?.page || 0) + 1;

                          return (
                            <Card
                              key={block._id}
                              onClick={() => onBlockSelect(block._id || "")}
                              className={cn(
                                "cursor-pointer border p-2 text-xs transition-all",
                                selectedBlockId === block._id
                                  ? "ring-primary bg-primary/5 ring-2"
                                  : "hover:bg-secondary/50"
                              )}
                            >
                              <p className="text-muted-foreground font-mono">
                                p{page} • ({x}, {y})
                              </p>
                            </Card>
                          );
                        })}
                      </div>
                    )}
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
