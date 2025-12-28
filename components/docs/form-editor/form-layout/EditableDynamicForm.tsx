"use client";

import { useState, useCallback, useEffect } from "react";
import { type IFormBlock, type IFormSigningParty } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2 } from "lucide-react";
import { renderBlocks } from "@/lib/block-renderer";

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
  selectedBlockIndex?: number | null;
  signingParties?: IFormSigningParty[];
}

/**
 * Editable variant of form display with draggable blocks
 * Supports drag-to-reorder and field editing
 * Can optionally display blocks grouped by signing parties with cross-party dragging
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
  selectedBlockIndex,
  signingParties = [],
}: EditableDynamicFormProps) => {
  const [blocks, setBlocks] = useState<IFormBlock[]>(initialBlocks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedFromPartyId, setDraggedFromPartyId] = useState<string | null>(null);

  useEffect(() => {
    setBlocks(initialBlocks);
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

      // If dragging between parties, update the block's signing_party_id
      if (targetPartyId && draggedFromPartyId !== targetPartyId) {
        draggedItem.signing_party_id = targetPartyId;
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
                    onDragStart: (index) => handleDragStart(index),
                    onDragOver: (index) => handleDragOver(index),
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
              <div className="space-y-1.5">
                {renderBlocks(
                  partyBlocks,
                  {
                    values,
                    onChange,
                    errors,
                    onBlurValidate,
                  },
                  {
                    editorMode: true,
                    onDragStart: (index) => handleDragStart(index, party._id),
                    onDragOver: (index) => handleDragOver(index, party._id),
                    onDragEnd: handleDragEnd,
                    draggedIndex,
                    onBlockClick: (index) => {
                      const blockIndex = blocks.findIndex((b) => b === partyBlocks[index]);
                      onBlockSelect?.(partyBlocks[index], blockIndex);
                    },
                    selectedIndex: selectedBlockIndex,
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Instruction card and buttons */}
      <Card className="mb-5 border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-800">
            {signingParties.length > 0
              ? "Drag blocks to reorder or move between parties. Edit form fields to see changes reflected in the metadata."
              : "Drag blocks to reorder them. Edit form fields to see changes reflected in the metadata."}
          </p>
          <div className="flex gap-2">
            {selectedBlockIndex !== null && selectedBlockIndex !== undefined && (
              <>
                {onDuplicateBlock && (
                  <Button
                    onClick={() => onDuplicateBlock(selectedBlockIndex)}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                )}
                {onDeleteBlock && (
                  <Button
                    onClick={() => onDeleteBlock(selectedBlockIndex)}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </>
            )}
            {onAddBlock && (
              <Button
                onClick={onAddBlock}
                size="sm"
                className="flex-shrink-0 gap-2 bg-slate-600 text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
                Add Block
              </Button>
            )}
          </div>
        </div>
      </Card>

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
  );
};
