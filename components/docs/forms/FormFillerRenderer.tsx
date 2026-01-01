"use client";

import { ClientBlock } from "@betterinternship/core/forms";
import { FieldRenderer } from "./FieldRenderer";
import { useFormRendererContext } from "./form-renderer.ctx";
import { getBlockField, isBlockField } from "./utils";
import { useFormFiller } from "./form-filler.ctx";
import { useMyAutofill } from "@/hooks/use-my-autofill";
import { FormActionButtons } from "./FormActionButtons";
import { HeaderRenderer, ParagraphRenderer } from "./BlockrRenderer";

export function FormFillerRenderer() {
  const form = useFormRendererContext();
  const formFiller = useFormFiller();
  const autofillValues = useMyAutofill();
  const filteredBlocks = form.blocks;

  return (
    <>
      <div className="relative flex max-h-[100%] min-h-[100%] flex-col overflow-auto">
        <div className="text-opacity-60 shadow-soft sticky top-0 z-[50] border-r border-b border-gray-300 bg-gray-100 px-7 py-3 text-2xl font-bold tracking-tighter text-gray-700">
          {form.formName}
        </div>
        <div className="flex-1 space-y-3 border-r border-gray-300 px-7">
          <BlocksRenderer
            formKey={form.formName}
            blocks={filteredBlocks}
            values={formFiller.getFinalValues(autofillValues)}
            onChange={formFiller.setValue}
            errors={formFiller.errors}
            setSelected={form.setSelectedPreviewId}
            onBlurValidate={() => formFiller.validate}
          />
        </div>
        <div className="py-3"></div>
        <div className="sticky bottom-0 z-[50] w-full border-t border-r border-gray-300 bg-gray-100 px-7 py-3">
          <FormActionButtons />
        </div>
      </div>
    </>
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
}: {
  formKey: string;
  blocks: ClientBlock<[T]>[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  setSelected: (selected: string) => void;
  onBlurValidate?: (fieldKey: string) => void;
}) => {
  if (!blocks.length) return null;
  const sortedBlocks = blocks.toSorted((a, b) => a.order - b.order);
  return sortedBlocks.map((block, i) => {
    const field = getBlockField(block)!;
    return (
      <>
        {isBlockField(block) && getBlockField(block)?.source === "manual" && (
          <div className="space-between flex flex-row" key={`${formKey}:${i}`}>
            <div
              className="flex-1"
              onFocus={() => setSelected(block.field_schema?.field as string)}
            >
              <FieldRenderer
                field={field}
                value={values[field.field]}
                onChange={(v) => onChange(field.field, v)}
                onBlur={() => onBlurValidate?.(field.field)}
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
