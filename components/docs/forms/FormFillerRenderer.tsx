"use client";

import { useEffect, useMemo, useRef } from "react";
import { ClientBlock } from "@betterinternship/core/forms";
import { FieldRenderer } from "./FieldRenderer";
import { HeaderRenderer, ParagraphRenderer } from "./BlockrRenderer";
import { useFormRendererContext } from "./form-renderer.ctx";
import { FormActionButtons } from "./FormActionButtons";
import { getBlockField, isBlockField } from "./utils";
import { useFormFiller } from "./form-filler.ctx";
import { useMyAutofill } from "@/hooks/use-my-autofill";

export function FormFillerRenderer({
  onValuesChange,
}: {
  onValuesChange?: (values: Record<string, string>) => void;
}) {
  const form = useFormRendererContext();
  const formFiller = useFormFiller();
  const autofillValues = useMyAutofill();
  const filteredBlocks = form.blocks;
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  console.log("filteredBlocks", filteredBlocks);

  // Deduplicate blocks: only keep first instance of each field ID
  const deduplicatedBlocks = useMemo(() => {
    const seenFieldIds = new Set<string>();
    return filteredBlocks.filter((block) => {
      if (!isBlockField(block)) return true; // Always include non-field blocks
      const field = getBlockField(block);
      if (!field) return true;

      // Only include if this is the first time we see this field ID
      if (seenFieldIds.has(field.field)) return false;
      seenFieldIds.add(field.field);
      return true;
    });
  }, [filteredBlocks]);

  const finalValues = useMemo(
    () => formFiller.getFinalValues(autofillValues),
    [formFiller, autofillValues]
  );

  // Notify parent of values change
  useEffect(() => {
    onValuesChange?.(finalValues);
  }, [finalValues, onValuesChange]);

  // Scroll to selected field
  useEffect(() => {
    if (!form.selectedPreviewId || !fieldRefs.current[form.selectedPreviewId]) return;

    const fieldElement = fieldRefs.current[form.selectedPreviewId];
    const scrollContainer = scrollContainerRef.current;

    if (fieldElement && scrollContainer) {
      // Scroll the field into view with a small padding
      fieldElement.scrollIntoView({ behavior: "smooth", block: "nearest" });

      // Add a highlight animation
      fieldElement.classList.add("ring-2", "ring-blue-400", "ring-offset-2", "rounded");
      setTimeout(() => {
        fieldElement.classList.remove("ring-2", "ring-blue-400", "ring-offset-2", "rounded");
      }, 1500);
    }
  }, [form.selectedPreviewId]);

  return (
    <div className="relative flex h-full flex-col rounded-[0.33em] border border-gray-300">
      <div ref={scrollContainerRef} className="relative flex flex-1 flex-col overflow-auto">
        <div className="text-opacity-60 shadow-soft border-r border-b border-gray-300 bg-gray-100 px-7 py-3 text-2xl font-bold tracking-tighter text-gray-700">
          {form.formName}
        </div>
        <div className="flex-1 space-y-2 border-r border-gray-300 px-7">
          <BlocksRenderer
            formKey={form.formName}
            blocks={deduplicatedBlocks}
            values={finalValues}
            onChange={formFiller.setValue}
            errors={formFiller.errors}
            setSelected={form.setSelectedPreviewId}
            onBlurValidate={(fieldKey, field) =>
              formFiller.validateField(fieldKey, field, autofillValues)
            }
            fieldRefs={fieldRefs.current}
            selectedFieldId={form.selectedPreviewId ?? undefined}
          />
        </div>
      </div>
      <div className="border-t border-r border-gray-300 bg-gray-100 px-7 py-3">
        <FormActionButtons />
      </div>
    </div>
  );
}

const BlocksRenderer = <T extends any[]>({
  formKey,
  blocks,
  values,
  onChange,
  errors,
  setSelected,
  onBlurValidate,
  fieldRefs,
  selectedFieldId,
}: {
  formKey: string;
  blocks: ClientBlock<T>[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  setSelected: (selected: string) => void;
  onBlurValidate?: (fieldKey: string, field: any) => void;
  fieldRefs: Record<string, HTMLDivElement | null>;
  selectedFieldId?: string;
}) => {
  if (!blocks.length) return null;
  const sortedBlocks = blocks.toSorted((a, b) => a.order - b.order);
  return sortedBlocks.map((block, i) => {
    const isForm = isBlockField(block);
    const field = isForm ? getBlockField(block) : null;

    // Only check selection for form fields
    const isSelected = isForm && field && selectedFieldId === field.field;

    // ! toremove
    console.log(field?.field, field?.type);

    return (
      <>
        {isForm && field?.source === "manual" && (
          <div className="space-between flex flex-row" key={`${formKey}:${i}`}>
            <div
              ref={(el) => {
                if (el && field) fieldRefs[field.field] = el;
              }}
              onClick={() => setSelected(block.field_schema?.field as string)}
              className={`flex-1 cursor-pointer px-1 py-2 transition-all ${isSelected ? "rounded-[0.33em] ring-2 ring-blue-500 ring-offset-2" : ""}`}
              onFocus={() => setSelected(block.field_schema?.field as string)}
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
