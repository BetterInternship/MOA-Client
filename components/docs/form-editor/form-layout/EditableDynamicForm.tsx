"use client";

import { useState, useCallback, useEffect } from "react";
import { type IFormBlock } from "@betterinternship/core/forms";
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
}

/**
 * Editable variant of form display with draggable blocks
 * Renders all block types: headers, paragraphs, form fields, phantom fields
 * Supports drag-to-reorder and field editing
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
}: EditableDynamicFormProps) => {
  const [blocks, setBlocks] = useState<IFormBlock[]>(initialBlocks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => {
      if (draggedIndex === null || draggedIndex === index) return;

      const newBlocks = [...blocks];
      const draggedItem = newBlocks[draggedIndex];
      newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(index, 0, draggedItem);

      setDraggedIndex(index);
      setBlocks(newBlocks);
    },
    [draggedIndex, blocks]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    onBlocksReorder?.(blocks);
  }, [blocks, onBlocksReorder]);

  return (
    <div className="space-y-4">
      {/* Instruction card and buttons */}
      <Card className="border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-800">
            Drag blocks to reorder them. Edit form fields to see changes reflected in the metadata.
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

      {/* Render all blocks in order */}
      {renderBlocks(
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
