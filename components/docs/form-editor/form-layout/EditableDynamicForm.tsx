"use client";

import { useState, useCallback, useEffect } from "react";
import { IFormBlock, IFormSigningParty } from "@betterinternship/core/forms";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { renderBlocks } from "@/lib/block-renderer";
import { Card } from "@/components/ui/card";
import { BlockEditor } from "./BlockEditor";

interface EditableDynamicFormProps {
  formName: string;
  blocks: IFormBlock[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
  onBlurValidate?: (fieldKey: string) => void;
  onBlocksReorder?: (blocks: IFormBlock[]) => void;
  onBlockSelect?: (block: IFormBlock, blockIndex: number) => void;
  onAddBlock?: () => void;
  onDeleteBlock?: (index: number) => void;
  onDuplicateBlock?: (index: number) => void;
  onBlockUpdate?: (block: IFormBlock) => void;
  selectedBlockIndex?: number | null;
  selectedBlock?: IFormBlock | null;
  signingParties?: IFormSigningParty[];
}

/**
 * Editable form with draggable blocks using array-based ordering.

 */
export const EditableDynamicForm = ({
  formName: _formName,
  blocks: initialBlocks,
  values,
  onChange,
  errors = {},
  onBlurValidate,
  onBlocksReorder,
  onBlockSelect,
  onAddBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onBlockUpdate,
  selectedBlockIndex,
  selectedBlock,
  signingParties = [],
}: EditableDynamicFormProps) => {
  const [blocks, setBlocks] = useState<IFormBlock[]>(initialBlocks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedFromPartyId, setDraggedFromPartyId] = useState<string | null>(null);

  useEffect(() => {
    // Only reset blocks if the structure fundamentally changed (different IDs)
    // This prevents losing local updates that haven't been synced back yet
    const initialBlockIds = initialBlocks.map((b) => b._id).join(",");
    const currentBlockIds = blocks.map((b) => b._id).join(",");
    
    if (initialBlockIds !== currentBlockIds) {
      // Block structure changed, reset
      setBlocks(initialBlocks);
    } else {
      // Structure is the same, but update each block's content to latest from parent
      // This ensures we get parent updates while preserving local state
      const updatedBlocks = blocks.map((block) => {
        const parentBlock = initialBlocks.find((b) => b._id === block._id);
        return parentBlock || block;
      });
      setBlocks(updatedBlocks);
    }
  }, [initialBlocks]);

  const handleDragStart = useCallback((index: number, partyId?: string) => {
    setDraggedIndex(index);
    setDraggedFromPartyId(partyId || null);
  }, []);

  const handleDragOver = useCallback(
    (index: number, targetPartyId?: string) => {
      if (draggedIndex === null || draggedIndex === index) return;

      const newBlocks = [...blocks];
      const draggedItem = newBlocks[draggedIndex];

      // If dragging to a party section, update the block's signing_party_id
      if (targetPartyId) {
        draggedItem.signing_party_id = targetPartyId;
      } else if (targetPartyId === undefined && draggedFromPartyId) {
        // Dragging to unassigned section - clear the party ID
        draggedItem.signing_party_id = "";
      }

      newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(index, 0, draggedItem);

      setDraggedIndex(index);
      setBlocks(newBlocks);
    },
    [draggedIndex, blocks, draggedFromPartyId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDraggedFromPartyId(null);
    onBlocksReorder?.(blocks);
  }, [blocks, onBlocksReorder]);

  const handleMoveUp = useCallback(() => {
    if (
      selectedBlockIndex === null ||
      selectedBlockIndex === undefined ||
      selectedBlockIndex === 0
    ) {
      return;
    }
    const newBlocks = [...blocks];
    [newBlocks[selectedBlockIndex - 1], newBlocks[selectedBlockIndex]] = [
      newBlocks[selectedBlockIndex],
      newBlocks[selectedBlockIndex - 1],
    ];
    setBlocks(newBlocks);
    onBlocksReorder?.(newBlocks);
  }, [blocks, selectedBlockIndex, onBlocksReorder]);

  const handleMoveDown = useCallback(() => {
    if (
      selectedBlockIndex === null ||
      selectedBlockIndex === undefined ||
      selectedBlockIndex === blocks.length - 1
    ) {
      return;
    }
    const newBlocks = [...blocks];
    [newBlocks[selectedBlockIndex], newBlocks[selectedBlockIndex + 1]] = [
      newBlocks[selectedBlockIndex + 1],
      newBlocks[selectedBlockIndex],
    ];
    setBlocks(newBlocks);
    onBlocksReorder?.(newBlocks);
  }, [blocks, selectedBlockIndex, onBlocksReorder]);
  const handleBlockUpdate = useCallback(
    (updatedBlock: IFormBlock) => {
      // Update local blocks state when a block is edited
      const newBlocks = blocks.map((b) => (b._id === updatedBlock._id ? updatedBlock : b));
      setBlocks(newBlocks);

      // If the updated block is currently selected, also update selectedBlock reference
      // This ensures the BlockEditor gets the fresh block with updated validator
      if (selectedBlockIndex !== null && selectedBlockIndex !== undefined) {
        onBlockSelect?.(updatedBlock, selectedBlockIndex);
      }

      // Also call parent's onBlockUpdate if provided
      onBlockUpdate?.(updatedBlock);
    },
    [blocks, selectedBlockIndex, onBlockSelect, onBlockUpdate]
  );
  // Group blocks by party if signingParties is provided
  const getGroupedBlocks = () => {
    if (signingParties.length === 0) {
      return { all: blocks };
    }

    const groups: Record<string, IFormBlock[]> = { unassigned: [] };
    signingParties.forEach((party) => {
      groups[party._id] = [];
    });

    blocks.forEach((block) => {
      if (block.signing_party_id && groups[block.signing_party_id]) {
        groups[block.signing_party_id].push(block);
      } else {
        groups.unassigned.push(block);
      }
    });

    return groups;
  };

  const renderBlocksWithGroups = () => {
    const groupedBlocks = getGroupedBlocks();

    return (
      <div className="space-y-6">
        {/* Unassigned blocks */}
        {Object.prototype.hasOwnProperty.call(groupedBlocks, "unassigned") &&
          groupedBlocks.unassigned.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-3 border-b-2 border-slate-300 pb-2">
                <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                <h4 className="text-sm font-semibold text-slate-700">Unassigned Blocks</h4>
                <span className="ml-auto text-xs text-slate-500">
                  {groupedBlocks.unassigned.length} block
                  {groupedBlocks.unassigned.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1.5">
                {renderBlocks(
                  groupedBlocks.unassigned,
                  {
                    values,
                    onChange,
                    errors,
                    onBlurValidate,
                  },
                  {
                    editorMode: true,
                    onDragStart: (index) => {
                      const globalIndex = blocks.findIndex(
                        (b) => b === groupedBlocks.unassigned[index]
                      );
                      handleDragStart(globalIndex);
                    },
                    onDragOver: (index) => {
                      const globalIndex = blocks.findIndex(
                        (b) => b === groupedBlocks.unassigned[index]
                      );
                      handleDragOver(globalIndex);
                    },
                    onDragEnd: handleDragEnd,
                    draggedIndex,
                    onBlockClick: (index) => {
                      const blockIndex = blocks.findIndex(
                        (b) => b === groupedBlocks.unassigned[index]
                      );
                      onBlockSelect?.(groupedBlocks.unassigned[index], blockIndex);
                    },
                    selectedIndex: selectedBlockIndex,
                  }
                )}
              </div>
            </div>
          )}

        {/* Party-grouped blocks */}
        {signingParties.map((party) => {
          const partyBlocks = groupedBlocks[party._id] || [];
          if (partyBlocks.length === 0) return null;

          // Separate manual and non-manual blocks within the party
          const manualBlocks = partyBlocks.filter(
            (b) => b.field_schema?.source === "manual" || !b.field_schema?.source
          );
          const autoBlocks = partyBlocks.filter(
            (b) => b.field_schema && b.field_schema.source !== "manual" && b.field_schema.source
          );

          return (
            <div key={party._id}>
              <div className="mb-3 flex items-center gap-3 pb-2">
                <h4 className="text-sm font-semibold text-slate-900">
                  {party._id}
                  {party.signatory_account?.name && (
                    <span className="ml-2 text-xs font-normal text-slate-600">
                      ({party.signatory_account.name})
                    </span>
                  )}
                </h4>
                <span className="ml-auto text-xs text-slate-500">
                  {partyBlocks.length} block{partyBlocks.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Manual fields subsection */}
              {manualBlocks.length > 0 && (
                <div className="mb-4 space-y-1.5 border-l-2 border-slate-300 pl-3">
                  <p className="mb-2 text-xs font-medium text-slate-600">Manual Fields</p>
                  {renderBlocks(
                    manualBlocks,
                    {
                      values,
                      onChange,
                      errors,
                      onBlurValidate,
                    },
                    {
                      editorMode: true,
                      onDragStart: (index) => {
                        const globalIndex = blocks.findIndex((b) => b === manualBlocks[index]);
                        handleDragStart(globalIndex, party._id);
                      },
                      onDragOver: (index) => {
                        const globalIndex = blocks.findIndex((b) => b === manualBlocks[index]);
                        handleDragOver(globalIndex, party._id);
                      },
                      onDragEnd: handleDragEnd,
                      draggedIndex,
                      onBlockClick: (index) => {
                        const blockIndex = blocks.findIndex((b) => b === manualBlocks[index]);
                        onBlockSelect?.(manualBlocks[index], blockIndex);
                      },
                      selectedIndex: selectedBlockIndex,
                    }
                  )}
                </div>
              )}

              {/* Auto-populated fields subsection */}
              {autoBlocks.length > 0 && (
                <div className="space-y-1.5 border-l-2 border-blue-300 bg-blue-50/30 pl-3">
                  <p className="mb-2 pt-2 pl-2 text-xs font-medium text-blue-700">
                    Non-Manual Fields
                  </p>
                  <div className="px-2 pb-2">
                    {renderBlocks(
                      autoBlocks,
                      {
                        values,
                        onChange,
                        errors,
                        onBlurValidate,
                      },
                      {
                        editorMode: true,
                        onDragStart: (index) => {
                          const globalIndex = blocks.findIndex((b) => b === autoBlocks[index]);
                          handleDragStart(globalIndex, party._id);
                        },
                        onDragOver: (index) => {
                          const globalIndex = blocks.findIndex((b) => b === autoBlocks[index]);
                          handleDragOver(globalIndex, party._id);
                        },
                        onDragEnd: handleDragEnd,
                        draggedIndex,
                        onBlockClick: (index) => {
                          const blockIndex = blocks.findIndex((b) => b === autoBlocks[index]);
                          onBlockSelect?.(autoBlocks[index], blockIndex);
                        },
                        selectedIndex: selectedBlockIndex,
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Left side - Toolbar + Form */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Editor toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div>
            {onAddBlock && (
              <Button
                onClick={onAddBlock}
                size="sm"
                variant="outline"
                className=""
                title="Add new block"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Add</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {selectedBlockIndex !== null && selectedBlockIndex !== undefined && (
              <>
                <Button
                  onClick={handleMoveUp}
                  size="sm"
                  variant="ghost"
                  disabled={selectedBlockIndex === 0}
                  className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  title="Move field up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleMoveDown}
                  size="sm"
                  variant="ghost"
                  disabled={selectedBlockIndex === blocks.length - 1}
                  className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  title="Move field down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                {onDuplicateBlock && (
                  <Button
                    onClick={() => onDuplicateBlock(selectedBlockIndex)}
                    size="sm"
                    variant="ghost"
                    className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    title="Duplicate field"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {onDeleteBlock && (
                  <Button
                    onClick={() => onDeleteBlock(selectedBlockIndex)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    title="Delete field"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Form scrollable area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="space-y-4 p-4 pb-12">
            {/* Render blocks */}
            {signingParties.length > 0
              ? renderBlocksWithGroups()
              : renderBlocks(
                  blocks,
                  {
                    values,
                    onChange,
                    errors,
                    onBlurValidate,
                  },
                  {
                    editorMode: true,
                    onDragStart: handleDragStart,
                    onDragOver: handleDragOver,
                    onDragEnd: handleDragEnd,
                    draggedIndex,
                    onBlockClick: (index) => onBlockSelect?.(blocks[index], index),
                    selectedIndex: selectedBlockIndex,
                  }
                )}
          </div>
        </div>
      </div>

      {/* Block Editor Sidebar */}
      <div className="w-100 overflow-y-auto border-l bg-gray-50">
        {selectedBlock ? (
          <BlockEditor
            block={selectedBlock}
            onClose={() => {
              // Clear selection through parent
            }}
            onUpdate={handleBlockUpdate}
            signingParties={signingParties.map((p) => ({
              id: p._id || `party-${p.order}`,
              name: p._id,
            }))}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <p>Select a block to edit</p>
          </div>
        )}
      </div>
    </div>
  );
};
