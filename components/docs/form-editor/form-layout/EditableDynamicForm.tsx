"use client";

import { useState, useCallback, useEffect } from "react";
import { type IFormBlock } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
      {/* Instruction card and Add button */}
      <Card className="border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-800">
            Drag blocks to reorder them. Edit form fields to see changes reflected in the metadata.
          </p>
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
