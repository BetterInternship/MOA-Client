"use client";

import { cn, coerceAnyDate } from "@/lib/utils";
import { ClientField } from "@betterinternship/core/forms";
import { useEffect, useRef, useState } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { useFormContext } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/form.ctx";
import { RecipientSection } from "./RecipientSection";

export function DynamicForm({
  formName,
  party,
  fields,
  values,
  setValues,
  autofillValues,
  onChange,
  errors = {},
  showErrors = false,
  setPreviews,
  pendingUrl,
  onBlurValidate,
}: {
  formName: string;
  party?: "entity" | "student-guardian" | "university" | "student";
  fields: ClientField<[]>[];
  values: Record<string, any>;
  autofillValues: Record<string, string>;
  errors?: Record<string, string>;
  showErrors?: boolean;
  pendingUrl: string;
  setValues: (values: Record<string, string>) => void;
  onChange: (key: string, value: any) => void;
  setPreviews?: (previews: Record<number, React.ReactNode[]>) => void;
  onBlurValidate?: (fieldKey: string) => void;
}) {
  const form = useFormContext();
  const filteredFields = fields.filter((field) => field.party === party);
  const [selectedField, setSelectedField] = useState<string>("");

  // Separate recipient fields (those whose field name ends with ":recipient")
  const recipientFields = filteredFields.filter((f) => String(f.field).endsWith(":recipient"));

  // All non-recipient fields
  const nonRecipientFields = filteredFields.filter((f) => !String(f.field).endsWith(":recipient"));

  // Group by section
  const entitySectionFields: ClientField<[]>[] = nonRecipientFields.filter(
    (d) => d.section === "entity"
  );
  const studentSectionFields: ClientField<[]>[] = nonRecipientFields.filter(
    (d) => d.section === "student"
  );
  const internshipSectionFields: ClientField<[]>[] = nonRecipientFields.filter(
    (d) => d.section === "internship"
  );
  const universitySectionFields: ClientField<[]>[] = nonRecipientFields.filter(
    (d) => d.section === "university"
  );

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
      .forEach((field) => {
        if (!newPreviews[field.page]) newPreviews[field.page] = [];
        newPreviews[field.page].push(
          <FieldPreview
            value={values[field.field] as string}
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
      <FormSection
        formKey={formName}
        title="Entity Information"
        fields={entitySectionFields}
        values={values}
        onChange={onChange}
        errors={errors}
        showErrors={showErrors}
        setSelected={setSelectedField}
        onBlurValidate={onBlurValidate}
      />

      <FormSection
        formKey={formName}
        title="Internship Information"
        fields={internshipSectionFields}
        values={values}
        onChange={onChange}
        errors={errors}
        showErrors={showErrors}
        setSelected={setSelectedField}
        onBlurValidate={onBlurValidate}
      />

      <FormSection
        formKey={formName}
        title="University Information"
        fields={universitySectionFields}
        values={values}
        onChange={onChange}
        errors={errors}
        showErrors={showErrors}
        setSelected={setSelectedField}
        onBlurValidate={onBlurValidate}
      />

      <FormSection
        formKey={formName}
        title="Student Information"
        fields={studentSectionFields}
        values={values}
        onChange={onChange}
        errors={errors}
        showErrors={showErrors}
        setSelected={setSelectedField}
        onBlurValidate={onBlurValidate}
      />

      <RecipientSection
        formKey={formName}
        title="Recipient Email(s) — IMPORTANT"
        subtitle="These email fields are important. Please double-check addresses, recipients are emailed a seperate form to them to complete and sign."
        fields={recipientFields}
        values={values}
        onChange={onChange}
        onBlurValidate={onBlurValidate}
        errors={errors}
        showErrors={showErrors}
      />
    </div>
  );
}

const FormSection = function FormSection({
  formKey,
  title,
  fields,
  values,
  onChange,
  errors,
  showErrors,
  setSelected,
  onBlurValidate,
}: {
  formKey: string;
  title: string;
  fields: ClientField<[]>[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  showErrors: boolean;
  setSelected: (selected: string) => void;
  onBlurValidate?: (fieldKey: string) => void;
}) {
  if (!fields.length) return null;
  const reducedFields = fields.reduce(
    (acc, cur) => (acc.map((f) => f.field).includes(cur.field) ? acc : [...acc, cur]),
    [] as ClientField<[]>[]
  );

  return (
    <div className="space-y-3">
      <div className="pt-2 pb-1">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>

      {reducedFields.map((field) => (
        <div
          className="space-between flex flex-row"
          key={`${formKey}:${field.section}:${field.field}`}
        >
          <div className="flex-1" onFocus={() => setSelected(field.field)}>
            <FieldRenderer
              field={field}
              value={values[field.field]}
              onChange={(v) => onChange(field.field, v)}
              onBlur={() => {
                console.log("onBlur triggered for field:", field.field);
                onBlurValidate?.(field.field);
              }}
              error={errors[field.field]}
              allValues={values}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Checks if field is empty, based on field type.
 *
 * @param field
 * @param value
 * @returns
 */
function isEmptyFor(field: ClientField<[]>, value: unknown) {
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
 *
 * @param field
 * @param value
 * @returns
 */
const coerceForField = (field: ClientField<[]>, value: unknown) => {
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
        "absolute top-0 left-0 border-0!",
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
