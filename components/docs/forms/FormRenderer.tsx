"use client";

import { cn, coerceAnyDate, formatDateWithoutTime } from "@/lib/utils";
import { ClientBlock, ClientField } from "@betterinternship/core/forms";
import { useEffect, useRef, useState } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { HeaderRenderer, ParagraphRenderer } from "./BlockrRenderer";
import { useFormRendererContext } from "./form-renderer.ctx";

export function FormRenderer({
  formName,
  signingPartyId,
  fields,
  blocks,
  values,
  setValues,
  autofillValues,
  onChange,
  errors = {},
  setPreviews,
  pendingUrl,
  onBlurValidate,
}: {
  formName: string;
  signingPartyId?: string;
  fields: ClientField<[any]>[];
  blocks: ClientBlock<[any]>[];
  values: Record<string, any>;
  autofillValues: Record<string, string>;
  errors?: Record<string, string>;
  pendingUrl: string;
  setValues: (values: Record<string, string>) => void;
  onChange: (key: string, value: any) => void;
  setPreviews?: (previews: Record<number, React.ReactNode[]>) => void;
  onBlurValidate?: (fieldKey: string) => void;
}) {
  const form = useFormRendererContext();
  const filteredFields = fields
    .filter((field) => field.signing_party_id === signingPartyId)
    .filter((field) => field.source === "manual");
  const [selectedField, setSelectedField] = useState<string>("");

  // Seed from saved autofill
  useEffect(() => {
    if (!autofillValues) return;

    const newValues = { ...values };
    for (const field of filteredFields) {
      const autofillValue = autofillValues[field.field];

      // Don't autofill if not empty or if nothing to autofill
      if (autofillValue === undefined) continue;
      if (!isEmptyFor(field, values[field.field])) continue;

      // Coerce autofill before putting it in
      const coercedAutofillValue = coerceForField(field, autofillValue);
      if (coercedAutofillValue !== undefined)
        newValues[field.field] = coercedAutofillValue.toString();
    }

    setValues(newValues);
  }, []);

  const refreshPreviews = () => {
    const newPreviews: Record<number, React.ReactNode[]> = {};
    // Push new previews here
    form.keyedFields
      .filter((kf) => filteredFields.find((f) => f.field === kf.field))
      .filter((kf) => kf.x && kf.y)
      .forEach((field) => {
        if (!newPreviews[field.page]) newPreviews[field.page] = [];
        const clientField = fields.find((f) => f.field === field.field);
        let value = values[field.field] as string;

        // Map values appropriately for preview
        if (clientField?.type === "date")
          value = formatDateWithoutTime(new Date(parseInt(value || "0")).toISOString());

        newPreviews[field.page].push(
          <FieldPreview
            value={value}
            x={field.x}
            y={field.y}
            w={field.w}
            h={field.h}
            selected={field.field === selectedField}
          />
        );
      });

    setPreviews?.(newPreviews);
  };

  // Refresh previews when fields change
  useEffect(() => {
    refreshPreviews();
  }, [form.keyedFields, values, pendingUrl]);

  return (
    <div className="space-y-4">
      <BlocksRenderer
        formKey={formName}
        blocks={blocks}
        values={values}
        onChange={onChange}
        errors={errors}
        setSelected={setSelectedField}
        onBlurValidate={onBlurValidate}
      />
    </div>
  );
}

const BlocksRenderer = ({
  formKey,
  blocks,
  values,
  onChange,
  errors,
  setSelected,
  onBlurValidate,
}: {
  formKey: string;
  blocks: ClientBlock<[any]>[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  setSelected: (selected: string) => void;
  onBlurValidate?: (fieldKey: string) => void;
}) => {
  if (!blocks.length) return null;

  const sortedBlocks = blocks.toSorted((a, b) => a.order - b.order);

  return sortedBlocks.map((block, i) => {
    const field = getBlockField(block);

    return (
      <div key={`${formKey}:${i}`}>
        {/* Render field blocks (manual fields only) */}
        {isBlockField(block) && field?.source === "manual" && (
          <div className="space-between flex flex-row">
            <div className="flex-1" onFocus={() => setSelected(field.field)}>
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

        {/* Render header blocks */}
        {block.block_type === "header" && block.text_content && (
          <div className="flex flex-row">
            <HeaderRenderer content={block.text_content} />
          </div>
        )}

        {/* Render paragraph blocks */}
        {block.block_type === "paragraph" && block.text_content && (
          <div className="flex flex-row">
            <ParagraphRenderer content={block.text_content} />
          </div>
        )}
      </div>
    );
  });
};

/**
 * Helper: Get the field from a block if it exists
 */
const getBlockField = (block: ClientBlock<any>): ClientField<any> | undefined => {
  return block.field_schema || block.phantom_field_schema;
};

/**
 * Helper: Check if a block contains a field (field_schema or phantom_field_schema)
 */
const isBlockField = (block: ClientBlock<any>): boolean => {
  return !!(block.field_schema || block.phantom_field_schema);
};

/**
 * Checks if field is empty, based on field type.
 *
 * @param field
 * @param value
 * @returns
 */
function isEmptyFor(field: ClientField<[any]>, value: unknown) {
  switch (field.type) {
    case "date":
      return !(typeof value === "number" && value > 0); // 0/undefined = empty
    case "signature":
      return value !== true;
    case "number":
      return value === undefined || value === "";
    default:
      return value === undefined || value === "";
  }
}

/**
 * Coerces the value into the type needed by the field.
 * Useful, used outside zod schemas.
 * // ! move this probably into the formMetadata core package
 *
 * @param field
 * @param value
 * @returns
 */
const coerceForField = (field: ClientField<[any]>, value: unknown) => {
  switch (field.type) {
    case "number":
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return value == null ? "" : String(value);
    case "date":
      return coerceAnyDate(value);
    case "time":
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return value == null ? "" : String(value);
    case "signature":
      return value === true;
    case "text":
    default:
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return value == null ? "" : String(value);
  }
};

/**
 * A preview of what the field will look like on the document.
 *
 * @component
 */
const FieldPreview = ({
  value,
  x,
  y,
  w,
  h,
  selected,
}: {
  value: string;
  x: number;
  y: number;
  w: number;
  h: number;
  selected?: boolean;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIntoView = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Scroll into view when selected
  useEffect(() => {
    if (selected) scrollIntoView();
    console.log("selected!");
  }, [selected]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "absolute top-0 left-0 truncate border-0! text-ellipsis",
        selected ? "bg-supportive/25" : "bg-primary/20"
      )}
      style={{
        userSelect: "auto",
        display: "inline-block",
        width: `round(var(--scale-factor) * ${w}px, 1px)`,
        height: `round(var(--scale-factor) * ${h}px, 1px)`,
        fontSize: "12px",
        transform: `translate(round(var(--scale-factor) * ${x}px, 1px), round(var(--scale-factor) * ${y}px, 1px))`,
        boxSizing: "border-box",
        cursor: "pointer",
        flexShrink: "0",
      }}
      onClick={() => scrollIntoView()}
    >
      {value}
    </div>
  );
};
