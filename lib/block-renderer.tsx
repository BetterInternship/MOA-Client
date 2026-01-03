/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-21
 * @ Description: Reusable block rendering utility for both editor and form display
 *                Supports all block types: headers, paragraphs, form fields, phantom fields
 */

import {
  type IFormBlock,
  type IFormField,
  type IFormPhantomField,
} from "@betterinternship/core/forms";
import { GripVertical } from "lucide-react";
import { FieldRenderer } from "@/components/docs/forms/FieldRenderer";

interface BlockRendererOptions {
  /** Whether this is editor mode (shows drag handle) */
  editorMode?: boolean;

  /** Whether to strip styling for clean form view */
  stripStyling?: boolean;

  /** Index of block in array (for drag operations) */
  blockIndex?: number;

  /** Handler for drag start */
  onDragStart?: (index: number) => void;

  /** Handler for drag over */
  onDragOver?: (index: number) => void;

  /** Handler for drag end */
  onDragEnd?: () => void;

  /** Currently dragged index */
  draggedIndex?: number | null;

  /** Handler for block click/selection */
  onBlockClick?: (index: number) => void;

  /** Index of selected block (for visual feedback) */
  selectedIndex?: number | null;

  /** Set of selected block IDs for mass selection */
  selectedBlockIds?: Set<string>;

  /** Handler for toggling block selection */
  onBlockToggle?: (blockId: string) => void;
}

interface BlockFieldProps {
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
  onBlurValidate?: (fieldKey: string) => void;
}

/**
 * Renders a single block based on its type
 * Works in both editor mode (with drag) and form mode (without drag)
 * @param block - The IFormBlock to render
 * @param fieldProps - Props for field rendering (values, onChange, etc.)
 * @param options - Rendering options (editor mode, drag handlers, etc.)
 * @returns JSX element or null
 */
export const renderBlock = (
  block: IFormBlock,
  fieldProps: BlockFieldProps,
  options: BlockRendererOptions = {}
) => {
  const {
    editorMode = false,
    stripStyling = false,
    blockIndex = 0,
    onDragStart,
    onDragOver,
    onDragEnd,
    draggedIndex,
    onBlockClick,
    selectedIndex,
    selectedBlockIds,
    onBlockToggle,
  } = options;

  const { values, onChange, errors = {}, onBlurValidate } = fieldProps;
  const blockId = `block:${block.order}`;

  const isSelected = selectedIndex === blockIndex;
  const baseClasses = stripStyling
    ? "space-y-2"
    : "flex gap-3 rounded-[0.33em] border p-2 transition-all cursor-pointer items-center";
  const dragClasses = !stripStyling
    ? editorMode
      ? draggedIndex === blockIndex
        ? "border-blue-300 bg-blue-100 opacity-50"
        : isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:bg-slate-50"
      : "border-slate-200 bg-white"
    : "";

  const draggableProps = editorMode
    ? {
        draggable: true,
        onDragStart: () => onDragStart?.(blockIndex),
        onDragOver: () => onDragOver?.(blockIndex),
        onDragEnd: () => onDragEnd?.(),
      }
    : {};

  // Header blocks
  if (block.block_type === "header") {
    if (stripStyling) {
      return (
        <h2 key={blockId} className="text-lg font-bold text-slate-800">
          {block.text_content}
        </h2>
      );
    }
    const isChecked = block._id ? selectedBlockIds?.has(block._id) : false;
    const inSelectMode = selectedBlockIds && selectedBlockIds.size > 0;
    return (
      <div key={blockId} className={`${baseClasses} ${dragClasses}`} {...draggableProps}>
        {editorMode && inSelectMode && block._id && (
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isChecked || false}
              onChange={() => onBlockToggle?.(block._id!)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 cursor-pointer"
            />
          </div>
        )}
        {editorMode && !inSelectMode && (
          <div className="flex-shrink-0">
            <GripVertical className="h-4 w-4 cursor-move text-slate-400" />
          </div>
        )}
        <div
          className={`${editorMode ? "flex-1" : "w-full"} cursor-pointer`}
          onClick={() => onBlockClick?.(blockIndex)}
        >
          <h2 className="text-lg font-bold text-slate-800">
            {block.text_content || (editorMode ? "  " : "")}
          </h2>
        </div>
      </div>
    );
  }

  // Paragraph blocks
  if (block.block_type === "paragraph") {
    if (stripStyling) {
      return (
        <p key={blockId} className="text-sm text-slate-700">
          {block.text_content}
        </p>
      );
    }
    const isChecked = block._id ? selectedBlockIds?.has(block._id) : false;
    const inSelectMode = selectedBlockIds && selectedBlockIds.size > 0;
    return (
      <div key={blockId} className={`${baseClasses} ${dragClasses}`} {...draggableProps}>
        {editorMode && inSelectMode && block._id && (
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isChecked || false}
              onChange={() => onBlockToggle?.(block._id!)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 cursor-pointer"
            />
          </div>
        )}
        {editorMode && !inSelectMode && (
          <div className="flex-shrink-0">
            <GripVertical className="h-4 w-4 cursor-move text-slate-400" />
          </div>
        )}
        <div
          className={`${editorMode ? "flex-1" : "w-full"} min-h-[2rem] cursor-pointer`}
          onClick={() => onBlockClick?.(blockIndex)}
        >
          <p className="text-sm text-slate-700">
            {block.text_content || (editorMode ? "(Empty paragraph)" : "")}
          </p>
        </div>
      </div>
    );
  }

  // Form field blocks
  if (block.block_type === "form_field" && block.field_schema) {
    const field = block.field_schema as IFormField;
    const fieldContent = (
      <FieldRenderer
        field={{
          field: field.field,
          label: field.label,
          tooltip_label: field.tooltip_label,
          type: field.type as "text" | "signature",
          source: field.source,
          signing_party_id: field.signing_party_id as string,
          shared: field.shared,
          validator: null,
          prefiller: null,
          options: undefined,
          coerce: (v) => v,
        }}
        value={String(values[field.field] ?? "")}
        onChange={(v) => onChange(field.field, v)}
        onBlur={() => onBlurValidate?.(field.field)}
        error={String(errors[field.field] ?? "")}
        allValues={values}
      />
    );

    if (stripStyling) {
      return <div key={blockId}>{fieldContent}</div>;
    }

    const isChecked = block._id ? selectedBlockIds?.has(block._id) : false;
    const inSelectMode = selectedBlockIds && selectedBlockIds.size > 0;
    return (
      <div key={blockId} className={`${baseClasses} ${dragClasses}`} {...draggableProps}>
        {editorMode && inSelectMode && block._id && (
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isChecked || false}
              onChange={() => onBlockToggle?.(block._id!)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 cursor-pointer"
            />
          </div>
        )}
        {editorMode && !inSelectMode && (
          <div className="flex-shrink-0">
            <GripVertical className="h-4 w-4 cursor-move text-slate-400" />
          </div>
        )}
        <div
          className={editorMode ? "flex-1" : "w-full"}
          onClick={() => onBlockClick?.(blockIndex)}
        >
          {fieldContent}
        </div>
      </div>
    );
  }

  // Phantom field blocks
  if (block.block_type === "form_phantom_field" && block.phantom_field_schema) {
    const field = block.phantom_field_schema as IFormPhantomField;
    const phantomClasses = !stripStyling
      ? editorMode
        ? draggedIndex === blockIndex
          ? "border-amber-300 bg-amber-100 opacity-50"
          : isSelected
            ? "border-amber-600 bg-amber-100 shadow-md"
            : "border-amber-200 bg-amber-50 hover:bg-amber-100"
        : "border-amber-200 bg-amber-50"
      : "";

    const fieldContent = (
      <FieldRenderer
        field={{
          field: field.field,
          label: field.label,
          tooltip_label: field.tooltip_label,
          type: field.type as "text" | "signature",
          source: field.source,
          signing_party_id: field.signing_party_id as string,
          shared: field.shared,
          validator: null,
          prefiller: null,
          options: undefined,
          coerce: (v) => v,
        }}
        value={String(values[field.field] ?? "")}
        onChange={(v) => onChange(field.field, v)}
        onBlur={() => onBlurValidate?.(field.field)}
        error={String(errors[field.field] ?? "")}
        allValues={values}
      />
    );

    if (stripStyling) {
      return <div key={blockId}>{fieldContent}</div>;
    }

    const isChecked = block._id ? selectedBlockIds?.has(block._id) : false;
    const inSelectMode = selectedBlockIds && selectedBlockIds.size > 0;
    return (
      <div key={blockId} className={`${baseClasses} ${phantomClasses}`} {...draggableProps}>
        {editorMode && inSelectMode && block._id && (
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isChecked || false}
              onChange={() => onBlockToggle?.(block._id!)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 cursor-pointer"
            />
          </div>
        )}
        {editorMode && !inSelectMode && (
          <div className="flex-shrink-0">
            <GripVertical className="h-4 w-4 cursor-move text-slate-400" />
          </div>
        )}
        <div
          className={editorMode ? "flex-1" : "w-full"}
          onClick={() => onBlockClick?.(blockIndex)}
        >
          {fieldContent}
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Batch render multiple blocks
 * Useful for rendering entire form or section
 * @param blocks - Array of blocks to render
 * @param fieldProps - Props for field rendering
 * @param options - Rendering options
 * @returns Array of JSX elements
 */
export const renderBlocks = (
  blocks: IFormBlock[],
  fieldProps: BlockFieldProps,
  options: BlockRendererOptions = {}
) => {
  return blocks.map((block, index) =>
    renderBlock(block, fieldProps, { ...options, blockIndex: index })
  );
};
