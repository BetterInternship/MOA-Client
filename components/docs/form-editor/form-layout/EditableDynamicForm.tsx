"use client";

import { useState, useCallback, useEffect } from "react";
import { type IFormBlock } from "@betterinternship/core/forms";
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
      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          ✓ Drag blocks to reorder them. Edit form fields to see changes reflected.
        </p>
      </div>

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
