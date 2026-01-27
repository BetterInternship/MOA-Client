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
import { getBlockField } from "@/components/docs/forms/utils";
import { BlocksRenderer } from "@/components/docs/forms/FormFillerRenderer";

interface FieldsPanelProps {
  blocks: IFormBlock[];
  selectedPartyId: string | null;
  onPartyChange: (partyId: string | null) => void;
  signingParties: IFormSigningParty[];
}

export function FieldsPanel({
  blocks,
  selectedPartyId,
  onPartyChange,
  signingParties,
}: FieldsPanelProps) {
  const { registry } = useFieldTemplateContext();
  const { formMetadata } = useFormEditor();
  const {
    selectedBlockId,
    selectedParentGroup,
    setSelectedParentGroup,
    setSelectedBlockId,
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

  // Create a map for easy lookup by field name
  const fieldMap = useMemo(() => {
    const map = new Map();
    metadataFields.forEach((field) => {
      map.set(field.field, field);
    });
    return map;
  }, [metadataFields]);

  // Reorder group helper
  const reorderGroup = (fromIndex: number, direction: "up" | "down") => {
    const group = groupedFields[fromIndex];
    if (!group) return;

    const groupKey = `${group.fieldName}-${group.partyId}`;

    const displayIdx = displayItems.findIndex(
      (item) => item.type === "group" && item.id === groupKey
    );

    if (displayIdx === -1) return;

    const targetIdx = direction === "up" ? displayIdx - 1 : displayIdx + 1;
    if (targetIdx < 0 || targetIdx >= displayItems.length) return;

    const newItems = [...displayItems];
    [newItems[displayIdx], newItems[targetIdx]] = [newItems[targetIdx], newItems[displayIdx]];

    const newBlocks: IFormBlock[] = [];
    newItems.forEach((item) => {
      if (item.block) newBlocks.push(item.block);
      if (item.instances) newBlocks.push(...item.instances);
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

    const newBlocks: IFormBlock[] = [];
    newItems.forEach((item) => {
      if (item.block) newBlocks.push(item.block);
      if (item.instances) newBlocks.push(...item.instances);
    });
    handleReorderBlocks(newBlocks);
    setDraggedGroupKey(null);
  };

  const displayItems = useMemo(() => {
    const items: Array<{
      type: "group" | "header" | "paragraph" | "phantom_field";
      id: string;
      block?: IFormBlock;
      fieldName?: string;
      partyId?: string;
      partyName?: string;
      partyOrder?: number;
      instances?: IFormBlock[];
      firstIndex: number;
    }> = [];

    if (selectedPartyId === null) return [];

    const groups: Record<
      string,
      {
        fieldName: string;
        partyId: string;
        partyName: string;
        partyOrder: number;
        instances: IFormBlock[];
        firstIndex: number;
      }
    > = {};

    blocks.forEach((block, index) => {
      const blockType = block.block_type;
      if (blockType === "header" || blockType === "paragraph" || blockType === "phantom_field") {
        if (block.signing_party_id === selectedPartyId) {
          items.push({
            type: blockType,
            id: block._id || `${blockType}-${index}`,
            block,
            firstIndex: index,
          });
        }
        return;
      }

      const schema = block.field_schema;
      if (!schema) return;

      const fieldName = schema.field || "Unnamed";
      const partyId = block.signing_party_id || "unknown";

      if (partyId !== selectedPartyId) return;

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

    Object.values(groups).forEach((group) => {
      items.push({
        type: "group",
        id: `${group.fieldName}-${group.partyId}`,
        fieldName: group.fieldName,
        partyId: group.partyId,
        partyName: group.partyName,
        partyOrder: group.partyOrder,
        instances: group.instances,
        firstIndex: group.firstIndex,
      });
    });

    return items.sort((a, b) => a.firstIndex - b.firstIndex);
  }, [blocks, signingParties, selectedPartyId]);

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
      field_schema: {
        field: field.name || field.id,
        ...field,
      },
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
        {selectedParentGroup && !showLibrary && (
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-medium text-gray-500">
              {selectedParentGroup.block_type === "header" ||
              selectedParentGroup.block_type === "paragraph" ||
              selectedParentGroup.block_type === "phantom_field"
                ? "Phantom Block Controls"
                : "Parent Group Controls"}
            </p>
            <div className="flex gap-0.5">
              <Button
                size="xs"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  // Check if it's a phantom block (use fieldName as block ID)
                  if (
                    selectedParentGroup.block_type === "header" ||
                    selectedParentGroup.block_type === "paragraph" ||
                    selectedParentGroup.block_type === "phantom_field"
                  ) {
                    // Find the phantom block in displayItems by its ID
                    const idx = displayItems.findIndex(
                      (item) => item.id === selectedParentGroup.fieldName
                    );
                    if (idx > 0) {
                      // Swap in displayItems only (blocks array stays as-is)
                      const newItems = [...displayItems];
                      [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
                      // Rebuild blocks array from all items in new order
                      const newBlocks: IFormBlock[] = [];
                      newItems.forEach((item) => {
                        if (item.block) newBlocks.push(item.block);
                        if (item.instances) newBlocks.push(...item.instances);
                      });
                      handleReorderBlocks(newBlocks);
                    }
                  } else {
                    // It's a field group
                    const idx = groupedFields.findIndex(
                      (g) =>
                        `${g.fieldName}-${g.partyId}` ===
                        `${selectedParentGroup.fieldName}-${selectedParentGroup.partyId}`
                    );
                    if (idx > 0) reorderGroup(idx, "up");
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
                    selectedParentGroup.block_type === "header" ||
                    selectedParentGroup.block_type === "paragraph" ||
                    selectedParentGroup.block_type === "phantom_field"
                  ) {
                    // Find the phantom block in displayItems by its ID
                    const idx = displayItems.findIndex(
                      (item) => item.id === selectedParentGroup.fieldName
                    );
                    if (idx < displayItems.length - 1) {
                      // Swap in displayItems only (blocks array stays as-is)
                      const newItems = [...displayItems];
                      [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
                      // Rebuild blocks array from all items in new order
                      const newBlocks: IFormBlock[] = [];
                      newItems.forEach((item) => {
                        if (item.block) newBlocks.push(item.block);
                        if (item.instances) newBlocks.push(...item.instances);
                      });
                      handleReorderBlocks(newBlocks);
                    }
                  } else {
                    // It's a field group
                    const idx = groupedFields.findIndex(
                      (g) =>
                        `${g.fieldName}-${g.partyId}` ===
                        `${selectedParentGroup.fieldName}-${selectedParentGroup.partyId}`
                    );
                    if (idx < groupedFields.length - 1) reorderGroup(idx, "down");
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
                  // Check if it's a phantom block
                  if (
                    selectedParentGroup.block_type === "header" ||
                    selectedParentGroup.block_type === "paragraph" ||
                    selectedParentGroup.block_type === "phantom_field"
                  ) {
                    // Delete the single phantom block
                    if (
                      confirm(
                        `Delete this ${selectedParentGroup.block_type}? This cannot be undone.`
                      )
                    ) {
                      handleDeleteBlock(selectedParentGroup.fieldName);
                      setSelectedParentGroup(null);
                    }
                  } else {
                    // Delete field group
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
                        setSelectedParentGroup(null);
                      }
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
                    // Handle non-group blocks (headers, paragraphs, phantom fields)
                    if (item.type !== "group") {
                      // Handle individual phantom blocks (header, paragraph, phantom_field)
                      const block = item.block!;
                      const blockType = block.block_type;

                      return (
                        <div key={item.id} className="space-y-2">
                          <div
                            draggable
                            onDragStart={(e) => handleGroupDragStart(e, block._id || "")}
                            onDragOver={handleGroupDragOver}
                            onDrop={(e) => handleGroupDrop(e, block._id || "")}
                            onClick={() => {
                              // Single click: select the block for editing
                              setSelectedBlockId(block._id || "");
                              setSelectedParentGroup({
                                fieldName: block._id || "",
                                partyId: selectedPartyId || "",
                                block_type: blockType || "block",
                                signing_party_id: selectedPartyId || undefined,
                              });
                            }}
                            className={cn(
                              "cursor-pointer border border-l-4 p-2 transition-all",
                              draggedGroupKey === block._id ? "bg-gray-100 opacity-50" : "",
                              selectedBlockId === block._id
                                ? "ring-primary bg-primary/5 ring-2"
                                : "hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <BlocksRenderer
                                  formKey={`block-preview-${block._id}`}
                                  blocks={[block]}
                                  values={{}}
                                  onChange={() => {}}
                                  errors={{}}
                                  setSelected={() => {}}
                                  onBlurValidate={() => {}}
                                  fieldRefs={{}}
                                />
                              </div>
                              <div
                                className="flex flex-shrink-0 items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0"
                                  onClick={() => handleDuplicateBlock(block)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="hover:text-destructive h-4 w-4 p-0"
                                  onClick={() => handleDeleteBlock(block._id || "")}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Handle field groups
                    const group = item;
                    const groupKey = `${group.fieldName}-${group.partyId}`;
                    const isExpanded = expandedGroups.has(groupKey);
                    const partyColor = getPartyColorByIndex(Math.max(0, group.partyOrder! - 1));

                    return (
                      <div key={groupKey} className="space-y-2">
                        {/* Parent Card - Field Group with Preview and Reorder */}
                        <Card
                          draggable
                          onDragStart={(e) => handleGroupDragStart(e, groupKey)}
                          onDragOver={handleGroupDragOver}
                          onDrop={(e) => handleGroupDrop(e, groupKey)}
                          onClick={() => {
                            setSelectedParentGroup({
                              fieldName: group.fieldName || "",
                              partyId: group.partyId || "",
                              block_type: "form_field",
                              signing_party_id: group.partyId,
                            });
                            toggleExpandedGroup(groupKey);
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
                                  {group.instances![0]?.field_schema?.label ||
                                    registry.find(
                                      (f) =>
                                        `${f.name}:${f.preset}` === group.fieldName ||
                                        f.name === group.fieldName
                                    )?.label}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {group.instances!.length} instance
                                  {group.instances!.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>

                            {/* Block Preview */}
                            <div className="space-y-2">
                              {group.instances![0] &&
                                (() => {
                                  const block = group.instances![0];
                                  const blockField = getBlockField(block);

                                  if (blockField?.source !== "manual") return null;

                                  const parsedField = blockField
                                    ? fieldMap.get(blockField.field)
                                    : null;
                                  const fieldWithParser = parsedField || blockField;

                                  const blockWithParsedField = {
                                    ...block,
                                    field_schema: fieldWithParser,
                                  };

                                  return (
                                    <div className="space-y-2 rounded border border-slate-200 bg-white px-1">
                                      <BlocksRenderer
                                        formKey={`preview-${group.fieldName}`}
                                        blocks={[blockWithParsedField]}
                                        values={previewValues}
                                        onChange={(key, value) => {
                                          setPreviewValues((prev) => ({
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
                                              setPreviewErrors((prev) => {
                                                const updated = { ...prev };
                                                delete updated[fieldKey];
                                                return updated;
                                              });
                                            } else {
                                              const treeified = z.treeifyError(result.error);
                                              const errorMsg = treeified.errors
                                                .map((e: string) => e.split(" ").slice(0).join(" "))
                                                .join(", ");
                                              setPreviewErrors((prev) => ({
                                                ...prev,
                                                [fieldKey]: errorMsg,
                                              }));
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

                        {/* Child Cards - Instances (expanded view) */}
                        {isExpanded && (
                          <div className="ml-4 space-y-2 border-l-2 pl-3">
                            <p className="text-xs font-medium text-gray-500">Instances</p>
                            {group.instances!.map((block) => {
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
                                    // Select the block instance for editing
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
