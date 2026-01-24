"use client";

import { IFormBlock, IFormSigningParty } from "@betterinternship/core/forms";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowLeft,
  Search as SearchIcon,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFieldTemplateContext } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getPartyColorByIndex } from "@/lib/party-colors";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { renderBlock } from "@/lib/block-renderer";
import { useFormEditorTab } from "@/app/contexts/form-editor-tab.context";

interface FieldsPanelProps {
  blocks: IFormBlock[];
  selectedPartyId: string | null;
  onPartyChange: (partyId: string | null) => void;
  onBlockSelect: (blockId: string) => void;
  selectedBlockId: string | null;
  signingParties: IFormSigningParty[];
  onAddField: (field: IFormBlock) => void;
  onParentGroupSelect?: (group: { fieldName: string; partyId: string } | null) => void;
  onBlocksReorder?: (blocks: IFormBlock[]) => void;
}

export function FieldsPanel({
  blocks,
  selectedPartyId,
  onPartyChange,
  onBlockSelect,
  selectedBlockId,
  signingParties,
  onAddField: _onAddField,
  onParentGroupSelect,
  onBlocksReorder,
}: FieldsPanelProps) {
  const { registry } = useFieldTemplateContext();
  const {
    selectedParentGroup,
    handleReorderBlocks,
    handleDeleteGroupBlocks,
    handleDuplicateBlock,
    handleDeleteBlock,
  } = useFormEditorTab();
  const [showLibrary, setShowLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedGroupKey, setDraggedGroupKey] = useState<string | null>(null);

  const toggleGroupExpanded = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Reorder grouped fields (parents)
  const reorderGroup = (currentIndex: number, direction: "up" | "down") => {
    const newGroups = [...groupedFields];
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= newGroups.length) return;

    [newGroups[currentIndex], newGroups[targetIndex]] = [
      newGroups[targetIndex],
      newGroups[currentIndex],
    ];

    // Flatten reordered groups for selected party
    const reorderedSelectedPartyBlocks = newGroups.flatMap((group) => group.instances);

    // Preserve blocks from all other parties that aren't selected
    const otherPartyBlocks = blocks.filter((block) => block.signing_party_id !== selectedPartyId);

    // Combine: reordered selected party blocks + unchanged other party blocks
    const finalBlocks = [...reorderedSelectedPartyBlocks, ...otherPartyBlocks];
    handleReorderBlocks(finalBlocks);
  };

  // Delete a group (all its instances)
  const deleteGroup = (groupIndex: number) => {
    const groupToDelete = groupedFields[groupIndex];
    handleDeleteGroupBlocks(groupToDelete.fieldName, groupToDelete.partyId);
  };

  // Handle drag and drop reordering
  const handleGroupDragStart = (e: React.DragEvent, groupKey: string) => {
    setDraggedGroupKey(groupKey);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupKey: string) => {
    e.preventDefault();
    if (!draggedGroupKey || draggedGroupKey === targetGroupKey) return;

    const draggedIdx = groupedFields.findIndex(
      (g) => `${g.fieldName}-${g.partyId}` === draggedGroupKey
    );
    const targetIdx = groupedFields.findIndex(
      (g) => `${g.fieldName}-${g.partyId}` === targetGroupKey
    );

    if (draggedIdx === -1 || targetIdx === -1) return;

    // Swap the groups
    const newGroups = [...groupedFields];
    [newGroups[draggedIdx], newGroups[targetIdx]] = [newGroups[targetIdx], newGroups[draggedIdx]];

    // Flatten reordered groups for selected party
    const reorderedSelectedPartyBlocks = newGroups.flatMap((group) => group.instances);

    // Preserve blocks from all other parties that aren't selected
    const otherPartyBlocks = blocks.filter((block) => block.signing_party_id !== selectedPartyId);

    // Combine: reordered selected party blocks + unchanged other party blocks
    const finalBlocks = [...reorderedSelectedPartyBlocks, ...otherPartyBlocks];
    handleReorderBlocks(finalBlocks);
    setDraggedGroupKey(null);
  };

  // Group blocks by field name and party, maintaining block order
  const groupedFields = useMemo(() => {
    const groups: Record<
      string,
      {
        fieldName: string;
        partyId: string;
        partyName: string;
        partyOrder: number;
        instances: IFormBlock[];
        firstIndex: number; // Track first appearance in blocks array for sorting
      }
    > = {};

    blocks.forEach((block, index) => {
      const schema = block.field_schema;
      if (!schema) return;

      const fieldName = schema.field || "Unnamed";
      const partyId = block.signing_party_id || "unknown";
      const party = signingParties.find((p) => p._id === partyId);
      const partyName = party?.signatory_title || "Unknown Party";
      const partyOrder = party?.order || 0;

      const key = `${fieldName}-${partyId}`;
      if (!groups[key]) {
        groups[key] = {
          fieldName,
          partyId,
          partyName,
          partyOrder,
          instances: [],
          firstIndex: index,
        };
      }
      groups[key].instances.push(block);
    });

    // Filter by selected party and sort by first appearance in blocks array
    const allGroups = Object.values(groups);
    if (selectedPartyId === null) {
      return [];
    }
    const filtered = allGroups.filter((group) => group.partyId === selectedPartyId);
    // Sort by firstIndex to maintain block order
    return filtered.sort((a, b) => a.firstIndex - b.firstIndex);
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
      {/* Header with Add Field Button and Toolbar */}
      <div className="space-y-2 border-b p-3">
        <Button
          onClick={() => setShowLibrary(!showLibrary)}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          {showLibrary ? <ArrowLeft className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showLibrary ? "Back to Fields" : "Add Field"}
        </Button>

        {/* Toolbar for selected group - Parent level operations */}
        {selectedParentGroup && !showLibrary && (
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-medium text-gray-500">Parent Group Controls</p>
            <div className="flex gap-0.5">
              <Button
                size="xs"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  const idx = groupedFields.findIndex(
                    (g) =>
                      `${g.fieldName}-${g.partyId}` ===
                      `${selectedParentGroup.fieldName}-${selectedParentGroup.partyId}`
                  );
                  if (idx > 0) reorderGroup(idx, "up");
                }}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  const idx = groupedFields.findIndex(
                    (g) =>
                      `${g.fieldName}-${g.partyId}` ===
                      `${selectedParentGroup.fieldName}-${selectedParentGroup.partyId}`
                  );
                  if (idx < groupedFields.length - 1) reorderGroup(idx, "down");
                }}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                className="hover:text-destructive h-6 w-6 p-0"
                onClick={() => {
                  const idx = groupedFields.findIndex(
                    (g) =>
                      `${g.fieldName}-${g.partyId}` ===
                      `${selectedParentGroup.fieldName}-${selectedParentGroup.partyId}`
                  );
                  if (idx !== -1) {
                    if (
                      confirm(
                        `Delete all instances of "${selectedParentGroup.fieldName}"? This cannot be undone.`
                      )
                    ) {
                      deleteGroup(idx);
                      onParentGroupSelect?.(null);
                    }
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showLibrary ? (
        // Field Library View
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-2.5 left-3 z-9999 h-4 w-4" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {filteredFields.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">No fields found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Group fields by tag */}
                {Array.from(
                  new Set(filteredFields.map((f) => f.tag || "Ungrouped").filter(Boolean))
                )
                  .sort((a, b) => {
                    // Always put "preset" on top
                    if (a.toLowerCase() === "preset") return -1;
                    if (b.toLowerCase() === "preset") return 1;
                    return a.localeCompare(b);
                  })
                  .map((tag) => {
                    const fieldsInTag = filteredFields
                      .filter((f) => f.tag === tag)
                      .sort((a, b) => {
                        // Sort fields by label or name
                        const labelA = a.label || a.name || "";
                        const labelB = b.label || b.name || "";
                        return labelA.localeCompare(labelB);
                      });

                    // Get tag display information
                    const tagDisplay = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
                    const fieldCount = fieldsInTag.length;

                    return (
                      <Collapsible key={tag} defaultOpen={true} className="space-y-2">
                        <CollapsibleTrigger className="hover:text-foreground hover:bg-primary/5 flex w-full items-center gap-2 rounded-md p-2 text-sm font-semibold transition-colors">
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                          {tagDisplay}{" "}
                          <span className="text-muted-foreground text-xs font-normal">
                            ({fieldCount} field{fieldCount !== 1 ? "s" : ""})
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-2 space-y-2">
                          {fieldsInTag.map((field) => (
                            <Card
                              key={field.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, field)}
                              onClick={() => handleFieldAdd(field)}
                              className="hover:border-primary/30 hover:bg-primary/5 cursor-move border border-transparent p-1 transition-all hover:shadow-md"
                            >
                              <div className="space-y-1">
                                <h4 className="text-foreground text-sm">
                                  {field.label || field.name}
                                </h4>
                              </div>
                            </Card>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Minimalist Tabs Layout - Parties on left, fields on right
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Party Tabs  */}
          <div className="flex w-1/5 flex-col overflow-y-auto border-r">
            {signingParties.map((party) => {
              const partyColor = getPartyColorByIndex(Math.max(0, party.order - 1));
              const isSelected = selectedPartyId === party._id;

              return (
                <button
                  key={party._id}
                  onClick={() => onPartyChange(party._id)}
                  className={cn(
                    "flex w-full items-start justify-start border-l-[3px] px-1 py-2 text-xs transition-all",
                    isSelected ? "shadow-sm" : "hover:bg-gray-50"
                  )}
                  style={{
                    backgroundColor: isSelected ? partyColor.hex + "25" : "transparent",
                    borderLeftColor: isSelected ? partyColor.hex : "transparent",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                  title={party.signatory_title}
                >
                  <span className="line-clamp-2">{party.signatory_title}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content - Fields for Selected Party (2/3) */}
          <div className="flex-1 overflow-auto p-4">
            {groupedFields.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">
                No fields for this party
              </p>
            ) : (
              <div className="space-y-3">
                {groupedFields.map((group, groupIndex) => {
                  const groupKey = `${group.fieldName}-${group.partyId}`;
                  const isExpanded = expandedGroups.has(groupKey);
                  const partyColor = getPartyColorByIndex(Math.max(0, group.partyOrder - 1));

                  return (
                    <div key={groupKey} className="space-y-2">
                      {/* Parent Card - Field Group with Preview and Reorder */}
                      <Card
                        draggable
                        onDragStart={(e) => handleGroupDragStart(e, groupKey)}
                        onDragOver={handleGroupDragOver}
                        onDrop={(e) => handleGroupDrop(e, groupKey)}
                        onClick={() => {
                          onBlockSelect("");
                          onParentGroupSelect?.({
                            fieldName: group.fieldName,
                            partyId: group.partyId,
                          });
                          toggleGroupExpanded(groupKey);
                        }}
                        className={cn(
                          "cursor-move border border-l-4 p-2 transition-all hover:shadow-md",
                          draggedGroupKey === groupKey ? "bg-gray-100 opacity-50" : "",
                          selectedParentGroup?.fieldName === group.fieldName &&
                            selectedParentGroup?.partyId === group.partyId
                            ? "bg-blue-50 ring-2 ring-blue-500"
                            : "",
                          `${partyColor.bg} ${partyColor.border}`
                        )}
                        style={{
                          borderLeftColor: partyColor.hex,
                        }}
                      >
                        <div className="space-y-3">
                          {/* Header with drag handle and title */}
                          <div className="flex items-start justify-start gap-2">
                            <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {group.instances[0]?.field_schema?.label ||
                                  registry.find(
                                    (f) =>
                                      `${f.name}:${f.preset}` === group.fieldName ||
                                      f.name === group.fieldName
                                  )?.label}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {group.instances.length} instance
                                {group.instances.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>

                          {/* Block Preview - Improved Styling */}
                          <div className="space-y-2">
                            {group.instances.map((block) => (
                              <div
                                key={block._id}
                                className="cursor-pointer rounded border border-gray-200 bg-white p-2 text-xs transition-colors hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBlockSelect(block._id || "");
                                }}
                              >
                                <div className="text-gray-700">
                                  {renderBlock(
                                    block,
                                    { values: {}, onChange: () => {} },
                                    { stripStyling: true }
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>

                      {/* Child Cards - Instances (expanded view) */}
                      {isExpanded && (
                        <div className="ml-4 space-y-2 border-l-2 pl-3">
                          <p className="text-xs font-medium text-gray-500">Instances</p>
                          {group.instances.map((block) => {
                            const x = Math.round(block.field_schema?.x || 0);
                            const y = Math.round(block.field_schema?.y || 0);
                            const page = (block.field_schema?.page || 0) + 1;

                            return (
                              <Card
                                key={block._id}
                                onClick={() => onBlockSelect(block._id || "")}
                                className={cn(
                                  "cursor-pointer border px-2 py-1.5 text-xs transition-all",
                                  selectedBlockId === block._id
                                    ? "ring-primary bg-primary/5 ring-2"
                                    : "hover:border-gray-300"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-muted-foreground flex-1 font-mono">
                                    page {page} • ({x}, {y})
                                  </p>
                                  <div
                                    className="flex flex-shrink-0 items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-4 w-4 p-0"
                                      onClick={() => {
                                        handleDuplicateBlock(block);
                                      }}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="hover:text-destructive h-4 w-4 p-0"
                                      onClick={() => {
                                        handleDeleteBlock(block._id || "");
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
