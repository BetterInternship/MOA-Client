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
  ChevronDown,
} from "lucide-react";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFieldTemplateContext } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { Input } from "@/components/ui/input";
import { FieldRegistryEntryDetails } from "@/app/api";
import { getPartyColorByIndex } from "@/lib/party-colors";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFormEditorTab } from "@/app/contexts/form-editor-tab.context";
import { useFormEditor } from "@/app/contexts/form-editor.context";
import z from "zod";
import { FormMetadata } from "@betterinternship/core/forms";
import { BlocksRenderer } from "@/components/docs/forms/FormFillerRenderer";

interface BlocksPanelProps {
  blocks: IFormBlock[];
  selectedPartyId: string | null;
  onPartyChange: (partyId: string | null) => void;
  signingParties: IFormSigningParty[];
}

export function BlocksPanel({
  blocks,
  selectedPartyId,
  onPartyChange,
  signingParties,
}: BlocksPanelProps) {
  const { registry } = useFieldTemplateContext();
  const { formMetadata } = useFormEditor();
  const {
    selectedBlockId,
    selectedBlockGroup,
    setSelectedBlockGroup,
    setSelectedBlockId,
    blockGroupsOrder,
    blockGroups,
    handleReorderBlocks,
    handleDuplicateBlock,
    handleDeleteBlock,
    handleAddPhantomBlock,
    handleDeleteGroupBlocks,
    handleBlockCreate,
    expandedGroups,
    toggleExpandedGroup,
    draggedGroupKey,
    setDraggedGroupKey,
    searchQuery,
    setSearchQuery,
    showPhantomMenu,
    setShowPhantomMenu,
    showLibrary,
    setShowLibrary,
    previewValues,
    setPreviewValues,
    previewErrors,
    setPreviewErrors,
  } = useFormEditorTab();

  // Get properly parsed fields from metadata with coerce functions and validators
  const metadataFields = useMemo(() => {
    if (!formMetadata) return [];
    try {
      const metadata = new FormMetadata(formMetadata);
      return metadata.getFieldsForClientService();
    } catch (error) {
      console.warn("Failed to parse metadata fields:", error);
      return [];
    }
  }, [formMetadata]);

  // Get blocks enriched with full metadata (type, coerce, validator, etc)
  const enrichedBlocks = useMemo(() => {
    if (!formMetadata) return [];
    try {
      const metadata = new FormMetadata(formMetadata);
      return metadata.getBlocksForClientService();
    } catch (error) {
      console.warn("Failed to get enriched blocks:", error);
      return [];
    }
  }, [formMetadata]);

  // Get the current selected block if one is selected
  const _selectedBlockId = selectedBlockId; // Keep reference for block lookup
  const selectedBlock = _selectedBlockId
    ? formMetadata?.schema.blocks?.find((b) => b._id === _selectedBlockId)
    : null;

  // Reorder group helper
  const reorderGroup = (itemId: string, direction: "up" | "down") => {
    // Find the item in displayItems by its id
    const itemIdx = displayItems.findIndex((item) => item.id === itemId);
    if (itemIdx === -1) return;

    // Skip divider - can't reorder across it
    const isDivider = (item: any) => item.type === "divider";

    let targetIdx = -1;
    if (direction === "up") {
      // Find the previous non-divider item
      for (let i = itemIdx - 1; i >= 0; i--) {
        if (!isDivider(displayItems[i])) {
          targetIdx = i;
          break;
        }
      }
    } else {
      // Find the next non-divider item
      for (let i = itemIdx + 1; i < displayItems.length; i++) {
        if (!isDivider(displayItems[i])) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx === -1) return; // Can't move

    // Swap the items in displayItems
    const newItems = [...displayItems];
    [newItems[itemIdx], newItems[targetIdx]] = [newItems[targetIdx], newItems[itemIdx]];

    // Build the new block order - collect all blocks from displayItems in order
    const newBlockOrder: string[] = [];
    newItems.forEach((item) => {
      if (item.type === "divider") return; // Skip divider
      if (item.instances) {
        item.instances.forEach((block) => {
          newBlockOrder.push(block._id);
        });
      }
    });

    // Build the new blocks array respecting the new order
    const blockIdToBlock = new Map(blocks.map((b) => [b._id, b]));
    const newBlocks = newBlockOrder
      .map((id) => blockIdToBlock.get(id))
      .filter(Boolean) as IFormBlock[];

    // Add any blocks that weren't in displayItems (e.g., blocks from other parties)
    const usedIds = new Set(newBlockOrder);
    blocks.forEach((block) => {
      if (!usedIds.has(block._id)) {
        newBlocks.push(block);
      }
    });

    handleReorderBlocks(newBlocks);
  };

  const deleteGroup = (index: number) => {
    const group = groupedFields[index];
    if (group?.fieldName && group?.partyId) {
      handleDeleteGroupBlocks(group.fieldName, group.partyId);
    }
  };

  const handleGroupDragStart = (e: React.DragEvent, groupKey: string) => {
    setDraggedGroupKey(groupKey);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleGroupDrop = (e: React.DragEvent, targetItemKey: string) => {
    e.preventDefault();
    if (!draggedGroupKey || draggedGroupKey === targetItemKey) return;

    const draggedIdx = displayItems.findIndex((item) => item.id === draggedGroupKey);
    const targetIdx = displayItems.findIndex((item) => item.id === targetItemKey);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newItems = [...displayItems];
    [newItems[draggedIdx], newItems[targetIdx]] = [newItems[targetIdx], newItems[draggedIdx]];

    // Extract the new order of block IDs from the reordered displayItems
    const newBlockOrderForCurrentParty: string[] = [];
    newItems.forEach((item) => {
      if (item.instances) {
        item.instances.forEach((block) => {
          newBlockOrderForCurrentParty.push(block._id);
        });
      }
    });

    // Map to look up blocks by ID
    const blockIdToBlock = new Map(blocks.map((b) => [b._id, b]));

    // Build new blocks array - preserve blocks from other parties, reorder current party
    const newBlocks: IFormBlock[] = [];
    const currentPartyBlockIdSet = new Set(newBlockOrderForCurrentParty);
    let nextCurrentPartyBlockIdx = 0;

    blocks.forEach((block) => {
      if (currentPartyBlockIdSet.has(block._id)) {
        // This is a current party block - use the next one from new order
        const nextBlockId = newBlockOrderForCurrentParty[nextCurrentPartyBlockIdx];
        const nextBlock = blockIdToBlock.get(nextBlockId);
        if (nextBlock) {
          newBlocks.push(nextBlock);
          nextCurrentPartyBlockIdx++;
        }
      } else {
        // This is NOT a current party block - keep it as-is
        newBlocks.push(block);
      }
    });

    handleReorderBlocks(newBlocks);
    setDraggedGroupKey(null);
  };

  const displayItems = useMemo(() => {
    if (selectedPartyId === null) return [];

    const items: Array<{
      type: "group" | "divider";
      id: string;
      fieldName?: string;
      partyId?: string;
      partyName?: string;
      partyOrder?: number;
      blockType?: string;
      instances?: IFormBlock[];
      isNonManual?: boolean;
    }> = [];

    // Helper to get party name and order
    const getPartyInfo = (partyId: string) => {
      const party = signingParties.find((p) => p._id === partyId);
      return {
        partyName: party?.signatory_title || "Unknown Party",
        partyOrder: party?.order || 0,
      };
    };

    let hasNonManualGroups = false;

    // Build items from blockGroupsOrder
    blockGroupsOrder.forEach((groupId) => {
      const group = blockGroups[groupId];
      if (!group) return;

      // Check if this group is for the selected party
      if (group.partyId !== selectedPartyId) return;

      // Filter blocks in this group by selected party
      const groupBlocks = group.blockIds
        .map((id) => blocks.find((b) => b._id === id))
        .filter(Boolean) as IFormBlock[];

      if (groupBlocks.length === 0) return;

      // Determine if non-manual
      const isNonManual = groupBlocks.some((b) => {
        const schema = b.field_schema || b.phantom_field_schema;
        return schema?.source && schema.source !== "manual";
      });

      if (isNonManual) {
        hasNonManualGroups = true;
        return; // Will add after divider
      }

      // For manual items, add to items array
      const { partyName, partyOrder } = getPartyInfo(selectedPartyId);
      const blockType = groupBlocks[0]?.block_type;
      items.push({
        type: "group",
        id: groupId,
        fieldName: group.fieldName,
        partyId: group.partyId,
        partyName,
        partyOrder,
        blockType,
        instances: groupBlocks,
      });
    });

    // Add divider if there are non-manual groups
    if (hasNonManualGroups) {
      items.push({
        type: "divider",
        id: "divider-non-manual",
      });

      // Add non-manual groups
      blockGroupsOrder.forEach((groupId) => {
        const group = blockGroups[groupId];
        if (!group) return;

        // Check if this group is for the selected party
        if (group.partyId !== selectedPartyId) return;

        const groupBlocks = group.blockIds
          .map((id) => blocks.find((b) => b._id === id))
          .filter(Boolean) as IFormBlock[];

        if (groupBlocks.length === 0) return;

        const isNonManual = groupBlocks.some((b) => {
          const schema = b.field_schema || b.phantom_field_schema;
          return schema?.source && schema.source !== "manual";
        });

        if (!isNonManual) return;

        const { partyName, partyOrder } = getPartyInfo(selectedPartyId);
        const blockType = groupBlocks[0]?.block_type;
        items.push({
          type: "group",
          id: groupId,
          fieldName: group.fieldName,
          partyId: group.partyId,
          partyName,
          partyOrder,
          blockType,
          instances: groupBlocks,
          isNonManual: true,
        });
      });
    }

    console.log("[BlocksPanel] displayItems computed result for", selectedPartyId, ":", {
      itemsCount: items.length,
      itemsBreakdown: items.map((i) => ({ type: i.type, id: i.id, fieldName: i.fieldName })),
    });

    return items;
  }, [blockGroupsOrder, blockGroups, blocks, signingParties, selectedPartyId]);

  const groupedFields = useMemo(() => {
    return displayItems.filter((item) => item.type === "group");
  }, [displayItems]);

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

  const handleFieldAdd = (
    field: FieldRegistryEntryDetails,
    type: "form_field" | "phantom_field" = "form_field"
  ) => {
    if (!selectedPartyId) return;

    const newBlock: IFormBlock = {
      _id: `block-${field.id}-${Date.now()}`,
      block_type: type,
      signing_party_id: selectedPartyId,
      order: blocks.length,
      field_schema: {
        field: field.name || field.id,
        ...field,
      } as any,
    };

    if (type === "phantom_field") {
      handleAddPhantomBlock("phantom_field", selectedPartyId, newBlock);
      setShowPhantomMenu(false);
    } else {
      handleBlockCreate(newBlock);
    }
  };

  // Filter preset fields for the phantom field dropdown
  const presetFields = useMemo(() => {
    return registry.filter((field) => field.tag === "preset");
  }, [registry]);

  return (
    <div className="flex h-full flex-col">
      {/* Header with Add Field Button and Toolbar */}
      <div className="space-y-2 border-b p-3">
        <div className="flex gap-2">
          <DropdownMenu open={showPhantomMenu} onOpenChange={setShowPhantomMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                onClick={() => {
                  if (!selectedPartyId) {
                    setShowPhantomMenu(false);
                    alert("Please select a party first");
                  }
                }}
                disabled={!selectedPartyId || presetFields.length === 0}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  if (!selectedPartyId) return;
                  handleAddPhantomBlock("header", selectedPartyId);
                  setShowPhantomMenu(false);
                }}
              >
                Add Header
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!selectedPartyId) return;
                  handleAddPhantomBlock("paragraph", selectedPartyId);
                  setShowPhantomMenu(false);
                }}
              >
                Add Paragraph
              </DropdownMenuItem>
              {presetFields.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-600">
                    Phantom Fields
                  </div>
                  {presetFields.map((field) => (
                    <DropdownMenuItem
                      key={field.id}
                      onClick={() => handleFieldAdd(field, "phantom_field")}
                    >
                      {field.label || field.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setShowLibrary(!showLibrary)}
            variant="default"
            size="sm"
            className="flex-1 gap-2"
          >
            {showLibrary ? <ArrowLeft className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showLibrary ? "Back to Fields" : "Add Field"}
          </Button>
        </div>

        {/* Toolbar for selected group/block - Parent level operations */}
        {selectedBlockGroup && !showLibrary && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-gray-500">Block Controls</p>
            <div className="flex gap-0.5">
              <Button
                size="xs"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  // Check if it's a phantom block
                  if (
                    selectedBlock?.block_type === "header" ||
                    selectedBlock?.block_type === "paragraph" ||
                    selectedBlock?.block_type === "phantom_field"
                  ) {
                    // Find the phantom block in displayItems by its ID
                    reorderGroup(selectedBlock._id || "", "up");
                  } else {
                    // It's a field group - use the group id directly
                    const itemId = selectedBlockGroup?.id;
                    if (itemId) {
                      reorderGroup(itemId, "up");
                    }
                  }
                }}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  // Check if it's a phantom block
                  if (
                    selectedBlock?.block_type === "header" ||
                    selectedBlock?.block_type === "paragraph" ||
                    selectedBlock?.block_type === "phantom_field"
                  ) {
                    // Find the phantom block in displayItems by its ID
                    reorderGroup(selectedBlock._id || "", "down");
                  } else {
                    // It's a field group - use the group id directly
                    const itemId = selectedBlockGroup?.id;
                    if (itemId) {
                      reorderGroup(itemId, "down");
                    }
                  }
                }}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                className="hover:text-destructive h-6 w-6 p-0"
                onClick={() => {
                  // Check if it's a phantom block or if we have a single block selected
                  if (selectedBlock) {
                    // Delete the single selected block

                    handleDeleteBlock(selectedBlock._id || "");
                    setSelectedBlockGroup(null);
                  } else if (selectedBlockGroup) {
                    // Delete the entire group

                    // For headers/paragraphs, delete by block IDs instead of fieldName
                    if (
                      selectedBlockGroup.fieldName === "header" ||
                      selectedBlockGroup.fieldName === "paragraph"
                    ) {
                      // Delete each block individually to avoid deleting all headers/paragraphs
                      selectedBlockGroup.blockIds.forEach((blockId) => {
                        handleDeleteBlock(blockId);
                      });
                    } else {
                      // For regular fields, use fieldName matching
                      handleDeleteGroupBlocks(
                        selectedBlockGroup.fieldName,
                        selectedBlockGroup.partyId
                      );
                    }
                    setSelectedBlockGroup(null);
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
                    "flex w-full items-start justify-start px-1 py-2 text-xs transition-all",
                    isSelected
                      ? "ring-primary font-semibold text-white ring-1 ring-inset"
                      : "text-gray-700 hover:opacity-80"
                  )}
                  style={{
                    backgroundColor: isSelected ? partyColor.hex : partyColor.hex + "25",
                    borderLeftColor: partyColor.hex,
                    ...(isSelected && {
                      outlineColor: partyColor.hex,
                      outlineWidth: "2px",
                      outlineOffset: "-2px",
                    }),
                  }}
                  title={party.signatory_title}
                >
                  <span className="w-full text-left break-words whitespace-normal">
                    {party.signatory_title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Content - Fields and Blocks for Selected Party */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-4">
              {displayItems.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  No fields or blocks for this party
                </p>
              ) : (
                <div className="space-y-3">
                  {displayItems.map((item) => {
                    // Handle divider
                    if ((item as any).type === "divider") {
                      return (
                        <div key="divider-non-manual" className="my-4 border-t border-gray-300">
                          <p className="mt-2 text-xs font-semibold text-gray-600">
                            Non-manual fields
                          </p>
                        </div>
                      );
                    }

                    // Handle field groups
                    const group = item;
                    // Use group.id as the key since it's unique for each group
                    const groupKey = group.id;
                    const isExpanded = expandedGroups.has(groupKey);

                    return (
                      <div key={groupKey} className="space-y-2">
                        {/* Parent Card - Field Group with Preview and Reorder */}
                        <Card
                          draggable
                          onDragStart={(e) => handleGroupDragStart(e, groupKey)}
                          onDragOver={handleGroupDragOver}
                          onDrop={(e) => handleGroupDrop(e, groupKey)}
                          onClick={() => {
                            setSelectedBlockId(null);
                            // For headers/paragraphs, use group.id which is the block._id
                            // For other fields, use fieldName-partyId
                            const groupId = group.id || `${group.fieldName}-${group.partyId}`;
                            console.log("[BlocksPanel] Selected group:", { groupId, group });
                            setSelectedBlockGroup({
                              id: groupId,
                              fieldName: group.fieldName || "",
                              partyId: group.partyId || "",
                              blockIds: group.instances?.map((b) => b._id) || [],
                            });
                            toggleExpandedGroup(groupKey);
                          }}
                          className={cn(
                            "cursor-move border p-2 transition-all hover:shadow-md",
                            draggedGroupKey === groupKey ? "bg-gray-100 opacity-50" : "",
                            selectedBlockGroup?.id === group.id
                              ? "ring-primary bg-blue-50 ring-2"
                              : "",
                            "border-gray-200"
                          )}
                        >
                          <div className="space-y-3">
                            {/* Header with drag handle and title */}
                            <div className="flex items-start justify-start gap-2">
                              <GripVertical className="mt-1 h-4 w-4 flex-shrink-0 text-gray-400" />
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-gray-900">
                                  {group.fieldName === "header" || group.fieldName === "paragraph"
                                    ? group.instances![0]?.text_content ||
                                      `(empty ${group.fieldName})`
                                    : (group.instances![0]?.field_schema?.label ||
                                        registry.find(
                                          (f) =>
                                            `${f.name}:${f.preset}` === group.fieldName ||
                                            f.name === group.fieldName
                                        )?.label) +
                                      (group.fieldName !== "header" &&
                                      group.fieldName !== "paragraph"
                                        ? ` (${group.instances!.length})`
                                        : "")}
                                </span>
                              </div>
                            </div>

                            {/* Block Preview */}
                            <div className="space-y-2">
                              {group.instances![0] &&
                                (() => {
                                  const block = group.instances![0];
                                  const enrichedBlock =
                                    enrichedBlocks.find((b) => b._id === block._id) || block;

                                  return (
                                    <div className="space-y-2 rounded bg-white px-1">
                                      <BlocksRenderer
                                        formKey={`preview-${group.fieldName}`}
                                        blocks={[enrichedBlock as any]}
                                        values={previewValues}
                                        onChange={(key, value) => {
                                          setPreviewValues((prev: any) => ({
                                            ...prev,
                                            [key]: value,
                                          }));
                                        }}
                                        errors={previewErrors}
                                        setSelected={() => {}}
                                        onBlurValidate={(fieldKey, field) => {
                                          if (field?.validator) {
                                            const value = previewValues[fieldKey] ?? "";
                                            const coerced = field.coerce?.(value) ?? value;
                                            const result = field.validator.safeParse(coerced);
                                            if (result.success) {
                                              const updated = { ...previewErrors };
                                              delete updated[fieldKey];
                                              setPreviewErrors(updated);
                                            } else {
                                              const treeified = z.treeifyError(result.error);
                                              const errorMsg = treeified.errors
                                                .map((e: string) => e.split(" ").slice(0).join(" "))
                                                .join(", ");
                                              setPreviewErrors({
                                                ...previewErrors,
                                                [fieldKey]: errorMsg,
                                              });
                                            }
                                          }
                                        }}
                                        fieldRefs={{}}
                                      />
                                    </div>
                                  );
                                })()}
                            </div>
                          </div>
                        </Card>

                        {/* Child Cards - Instances (expanded view) - Only for form fields */}
                        {isExpanded &&
                          group.fieldName !== "header" &&
                          group.fieldName !== "paragraph" &&
                          group.blockType !== "form_phantom_field" && (
                            <div className="ml-4 space-y-2 pl-3">
                              <p className="text-xs font-medium text-gray-500">Instances</p>
                              {group.instances!.map((block) => {
                                // For headers/paragraphs, don't show location info
                                if (
                                  block.block_type === "header" ||
                                  block.block_type === "paragraph"
                                ) {
                                  return (
                                    <Card
                                      key={block._id}
                                      className={cn(
                                        "cursor-pointer border px-2 py-1.5 text-xs transition-all",
                                        "hover:border-gray-300"
                                      )}
                                      onClick={() => {
                                        setSelectedBlockId(block._id || "");
                                      }}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-muted-foreground flex-1">
                                          {block.text_content || `(empty ${block.block_type})`}
                                        </p>
                                      </div>
                                    </Card>
                                  );
                                }

                                // For field groups, show location info
                                const x = Math.round(block.field_schema?.x || 0);
                                const y = Math.round(block.field_schema?.y || 0);
                                const page = (block.field_schema?.page || 0) + 1;

                                return (
                                  <Card
                                    key={block._id}
                                    className={cn(
                                      "cursor-pointer border px-2 py-1.5 text-xs transition-all",
                                      "hover:border-gray-300"
                                    )}
                                    onClick={() => {
                                      setSelectedBlockId(block._id || "");
                                    }}
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
        </div>
      )}
    </div>
  );
}
