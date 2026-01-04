"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { type IFormBlock, type IFormMetadata } from "@betterinternship/core/forms";
import { FieldRenderer } from "@/components/docs/forms/FieldRenderer";
import { HeaderRenderer, ParagraphRenderer } from "@/components/docs/forms/BlockrRenderer";
import { getBlockField, isBlockField } from "@/components/docs/forms/utils";
import { validateFieldWithZod } from "@/lib/form-validation";

interface FormPreviewRendererProps {
  formName: string;
  blocks: IFormBlock[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  metadata?: IFormMetadata;
}

/**
 * Simple form preview renderer that replicates FormFillerRenderer
 * but without context, validation, or autofill dependencies
 */
export const FormPreviewRenderer = ({
  formName,
  blocks,
  values,
  onChange,
  metadata,
}: FormPreviewRendererProps) => {
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const hasInitialized = useRef(false);

  console.log("[FormPreviewRenderer] Received blocks:", blocks);
  console.log("[FormPreviewRenderer] Received values:", values);

  // Deduplicate blocks: only keep first instance of each field ID
  const deduplicatedBlocks = useMemo(() => {
    const seenFieldIds = new Set<string>();
    return blocks.filter((block) => {
      if (!isBlockField(block)) return true; // Always include non-field blocks
      const field = getBlockField(block);
      if (!field) return true;

      // Only include if this is the first time we see this field ID
      if (seenFieldIds.has(field.field)) return false;
      seenFieldIds.add(field.field);
      return true;
    });
  }, [blocks]);

  // Initialize values from prefiller only once on mount
  useEffect(() => {
    if (hasInitialized.current) return;

    const initialValues: Record<string, string> = {};
    deduplicatedBlocks.forEach((block) => {
      const field = getBlockField(block);
      if (field && "prefiller" in field && field.prefiller) {
        try {
          // Execute the prefiller function
          const prefillerFn =
            typeof field.prefiller === "string"
              ? new Function("return " + field.prefiller)()
              : field.prefiller;

          if (typeof prefillerFn === "function") {
            const value = prefillerFn({ signatory: {} });
            initialValues[field.field] = typeof value === "string" ? value.trim() : String(value);
          }
        } catch (error) {
          console.log(`[FormPreviewRenderer] Prefiller error for ${field.field}:`, error);
        }
      }
    });

    setLocalValues(initialValues);
    hasInitialized.current = true;
  }, [deduplicatedBlocks]);

  // Merge local values with prop values (prop values take precedence for user input)
  const displayValues = useMemo(() => {
    return { ...localValues, ...values };
  }, [localValues, values]);

  const handleChange = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    onChange(key, value);
  };

  const sortedBlocks = useMemo(
    () => [...deduplicatedBlocks].sort((a, b) => a.order - b.order),
    [deduplicatedBlocks]
  );

  console.log("[FormPreviewRenderer] Sorted blocks:", sortedBlocks);

  if (!sortedBlocks.length) {
    console.log("[FormPreviewRenderer] No blocks to display");
    return <div className="py-8 text-center text-sm text-slate-500">No blocks to display</div>;
  }

  const handleBlurValidate = (fieldKey: string, field: any) => {
    if (!metadata) return;
    const error = validateFieldWithZod(fieldKey, displayValues[fieldKey], metadata);
    setErrors((prev) => ({
      ...prev,
      [fieldKey]: error || "",
    }));
    console.log(`[FormPreviewRenderer] Blur validation for ${fieldKey}:`, error);
  };

  return (
    <div className="relative flex h-full flex-col rounded-[0.33em] border border-gray-300">
      <div ref={scrollContainerRef} className="relative flex flex-1 flex-col overflow-auto">
        <div className="text-opacity-60 shadow-soft border-r border-b border-gray-300 bg-gray-100 px-7 py-3 text-2xl font-bold tracking-tighter text-gray-700">
          {formName}
        </div>
        <div className="mt-7 flex-1 space-y-2 border-r border-gray-300 px-7">
          <BlocksRenderer
            formKey={formName}
            blocks={sortedBlocks}
            values={displayValues}
            onChange={handleChange}
            errors={errors}
            onBlurValidate={handleBlurValidate}
            fieldRefs={fieldRefs.current}
          />
        </div>
      </div>
    </div>
  );
};

const BlocksRenderer = ({
  formKey,
  blocks,
  values,
  onChange,
  errors,
  onBlurValidate,
  fieldRefs,
}: {
  formKey: string;
  blocks: IFormBlock[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  onBlurValidate?: (fieldKey: string, field: any) => void;
  fieldRefs: Record<string, HTMLDivElement | null>;
}) => {
  if (!blocks.length) return null;

  return blocks.map((block, i) => {
    const isForm = isBlockField(block);
    const field = isForm ? getBlockField(block) : null;

    console.log(`[BlocksRenderer] Rendering block ${i}:`, {
      block_type: block.block_type,
      field: field?.field,
      source: field?.source,
    });

    return (
      <>
        {isForm && field?.source === "manual" && (
          <div className="space-between flex flex-row" key={`${formKey}:${i}`}>
            <div
              ref={(el) => {
                if (el && field) fieldRefs[field.field] = el;
              }}
              className="flex-1 cursor-pointer px-1 py-2 transition-all"
            >
              <FieldRenderer
                field={field}
                value={values[field.field]}
                onChange={(v) => onChange(field.field, v)}
                onBlur={() => onBlurValidate?.(field.field, field)}
                error={errors[field.field]}
                allValues={values}
              />
            </div>
          </div>
        )}
        {block.block_type === "header" && block.text_content && (
          <div className="flex flex-row">
            <HeaderRenderer content={block.text_content} />
          </div>
        )}
        {block.block_type === "paragraph" && block.text_content && (
          <div className="flex flex-row">
            <ParagraphRenderer content={block.text_content} />
          </div>
        )}
      </>
    );
  });
};
