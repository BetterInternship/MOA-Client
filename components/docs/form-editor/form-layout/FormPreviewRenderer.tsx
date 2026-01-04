"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { type IFormBlock, type IFormMetadata, FormMetadata } from "@betterinternship/core/forms";
import { FieldRenderer } from "@/components/docs/forms/FieldRenderer";
import { HeaderRenderer, ParagraphRenderer } from "@/components/docs/forms/BlockrRenderer";
import { getBlockField, isBlockField } from "@/components/docs/forms/utils";

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

  // Extract actual fields from metadata for proper validation and field types
  const metadataFields = useMemo(() => {
    if (!metadata) return [];
    try {
      const formMetadata = new FormMetadata(metadata);
      return formMetadata.getFieldsForClientService();
    } catch (error) {
      return [];
    }
  }, [metadata]);

  // Create a map of field name to field object for easy lookup
  const fieldMap = useMemo(() => {
    const map = new Map();
    metadataFields.forEach((field) => {
      map.set(field.field, field);
    });
    return map;
  }, [metadataFields]);

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
    metadataFields.forEach((field) => {
      if (field.prefiller) {
        try {
          // Execute the prefiller function from metadata
          const value = field.prefiller({ signatory: {} });
          initialValues[field.field] = typeof value === "string" ? value.trim() : String(value);
        } catch (error) {
          // Silently skip if prefiller fails
        }
      }
    });

    setLocalValues(initialValues);
    hasInitialized.current = true;
  }, [metadataFields]);

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

  if (!sortedBlocks.length) {
    return <div className="py-8 text-center text-sm text-slate-500">No blocks to display</div>;
  }

  const handleBlurValidate = (fieldKey: string) => {
    const field = fieldMap.get(fieldKey);
    if (!field || field.source !== "manual") return;

    const value = displayValues[fieldKey];
    const coerced = field.coerce(value);
    const result = field.validator?.safeParse(coerced);

    if (result?.error) {
      const z = require("zod");
      const errorString = z
        .treeifyError(result.error)
        .errors.map((e: string) => e.split(" ").slice(0).join(" "))
        .join("\n");
      setErrors((prev) => ({
        ...prev,
        [fieldKey]: `${field.label}: ${errorString}`,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
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
            fieldMap={fieldMap}
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
  fieldMap,
}: {
  formKey: string;
  blocks: IFormBlock[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  onBlurValidate?: (fieldKey: string) => void;
  fieldRefs: Record<string, HTMLDivElement | null>;
  fieldMap: Map<string, any>;
}) => {
  if (!blocks.length) return null;

  return blocks.map((block, i) => {
    const isForm = isBlockField(block);
    const blockField = isForm ? getBlockField(block) : null;

    // Get the actual field from metadata (has validators and proper type info)
    const metadataField = blockField ? fieldMap.get(blockField.field) : null;

    return (
      <>
        {isForm && blockField?.source === "manual" && metadataField && (
          <div className="space-between flex flex-row" key={`${formKey}:${i}`}>
            <div
              ref={(el) => {
                if (el && blockField) fieldRefs[blockField.field] = el;
              }}
              className="flex-1 cursor-pointer px-1 py-2 transition-all"
            >
              <FieldRenderer
                field={metadataField}
                value={values[blockField.field]}
                onChange={(v) => onChange(blockField.field, v)}
                onBlur={() => onBlurValidate?.(blockField.field)}
                error={errors[blockField.field]}
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
