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
    blockIndex = 0,
    onDragStart,
    onDragOver,
    onDragEnd,
    draggedIndex,
    onBlockClick,
    selectedIndex,
  } = options;

  const { values, onChange, errors = {}, onBlurValidate } = fieldProps;
  const blockId = `block:${block.order}`;

  const isSelected = selectedIndex === blockIndex;
  const baseClasses = "flex gap-3 rounded-lg border p-4 transition-all cursor-pointer";
  const dragClasses = editorMode
    ? draggedIndex === blockIndex
      ? "border-blue-300 bg-blue-100 opacity-50"
      : isSelected
        ? "border-blue-500 bg-blue-50 shadow-md"
        : "border-slate-200 bg-white hover:bg-slate-50"
    : "border-slate-200 bg-white";

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
    return (
      <div
        key={blockId}
        className={`${baseClasses} ${dragClasses}`}
        {...draggableProps}
        onClick={() => onBlockClick?.(blockIndex)}
      >
        {editorMode && (
          <div className="flex-shrink-0 pt-2">
            <GripVertical className="h-4 w-4 cursor-move text-slate-400" />
          </div>
        )}
        <div className={editorMode ? "flex-1" : "w-full"}>
          <h2 className="text-lg font-bold text-slate-800">{block.text_content}</h2>
        </div>
      </div>
    );
  }

  // Paragraph blocks
  if (block.block_type === "paragraph") {
    return (
      <div
        key={blockId}
        className={`${baseClasses} ${dragClasses}`}
        {...draggableProps}
        onClick={() => onBlockClick?.(blockIndex)}
      >
        {editorMode && (
          <div className="flex-shrink-0 pt-2">
            <GripVertical className="h-4 w-4 cursor-move text-slate-400" />
          </div>
        )}
        <div className={editorMode ? "flex-1" : "w-full"}>
          <p className="text-sm text-slate-700">{block.text_content}</p>
        </div>
      </div>
    );
  }

  // Form field blocks
  if (block.block_type === "form_field" && block.field_schema) {
    const field = block.field_schema as IFormField;
    return (
      <div
        key={blockId}
        className={`${baseClasses} ${dragClasses}`}
        {...draggableProps}
        onClick={() => onBlockClick?.(blockIndex)}
      >
        {editorMode && (
          <div className="flex-shrink-0 pt-2">
            <GripVertical className="h-4 w-4 cursor-move text-slate-400" />
          </div>
        )}
        <div className={editorMode ? "flex-1" : "w-full"}>
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
        </div>
      </div>
    );
  }

  // Phantom field blocks
  if (block.block_type === "form_phantom_field" && block.phantom_field_schema) {
    const field = block.phantom_field_schema as IFormPhantomField;
    const phantomClasses = editorMode
      ? draggedIndex === blockIndex
        ? "border-amber-300 bg-amber-100 opacity-50"
        : isSelected
          ? "border-amber-600 bg-amber-100 shadow-md"
          : "border-amber-200 bg-amber-50 hover:bg-amber-100"
      : "border-amber-200 bg-amber-50";

    return (
      <div
        key={blockId}
        className={`${baseClasses} ${phantomClasses}`}
        {...draggableProps}
        onClick={() => onBlockClick?.(blockIndex)}
      >
        {editorMode && (
          <div className="flex-shrink-0 pt-2">
            <GripVertical className="h-4 w-4 cursor-move text-amber-400" />
          </div>
        )}
        <div className={editorMode ? "flex-1" : "w-full"}>
          <p className="mb-2 text-xs font-semibold text-amber-700">🔒 PHANTOM FIELD</p>
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
