"use client";

import { useState, useCallback, useEffect } from "react";
import { FieldRenderer } from "@/components/docs/forms/FieldRenderer";
import { GripVertical } from "lucide-react";
import { ClientField } from "@betterinternship/core/forms";

interface EditableDynamicFormProps {
  formName: string;
  party?: "entity" | "student-guardian" | "university" | "student";
  fields: ClientField<[]>[];
  values: Record<string, any>;
  setValues: (values: Record<string, string>) => void;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
  showErrors?: boolean;
  onBlurValidate?: (fieldKey: string) => void;
  onFieldsReorder?: (fields: ClientField<[]>[]) => void;
}

/**
 * Editable variant of DynamicForm with draggable fields
 * Uses FieldRenderer to display actual form inputs with drag-to-reorder
 */
export const EditableDynamicForm = ({
  formName,
  party,
  fields: initialFields,
  values,
  setValues,
  onChange,
  errors = {},
  showErrors = false,
  onBlurValidate,
  onFieldsReorder,
}: EditableDynamicFormProps) => {
  const [fields, setFields] = useState<ClientField<[]>[]>(initialFields);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  const filteredFields = fields
    .filter((field) => field.party === party)
    .filter((field) => field.source === "manual" || party !== "student");

  // Separate recipient fields
  const recipientFields = filteredFields.filter((f) => String(f.field).endsWith(":recipient"));
  const nonRecipientFields = filteredFields.filter((f) => !String(f.field).endsWith(":recipient"));

  // Group by section
  const entitySectionFields = nonRecipientFields.filter((d) => d.section === "entity");
  const internshipSectionFields = nonRecipientFields.filter((d) => d.section === "internship");
  const universitySectionFields = nonRecipientFields.filter((d) => d.section === "university");
  const studentSectionFields = nonRecipientFields.filter((d) => d.section === "student");

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => {
      if (draggedIndex === null || draggedIndex === index) return;

      const newFields = [...filteredFields];
      const draggedItem = newFields[draggedIndex];
      newFields.splice(draggedIndex, 1);
      newFields.splice(index, 0, draggedItem);

      setDraggedIndex(index);
      setFields(newFields);
    },
    [draggedIndex, filteredFields]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    onFieldsReorder?.(fields);
  }, [fields, onFieldsReorder]);

  const renderField = (field: ClientField<[]>, index: number) => (
    <div
      key={`${formName}:${field.section}:${field.field}`}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={() => handleDragOver(index)}
      onDragEnd={handleDragEnd}
      className={`flex gap-3 rounded-lg border p-4 transition-all ${
        draggedIndex === index
          ? "border-blue-300 bg-blue-100 opacity-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0 pt-2">
        <GripVertical className="h-4 w-4 cursor-move text-slate-400" />
      </div>

      {/* Field Rendered */}
      <div className="flex-1">
        <FieldRenderer
          field={field}
          value={values[field.field]}
          onChange={(v) => onChange(field.field, v)}
          onBlur={() => {
            onBlurValidate?.(field.field);
          }}
          error={errors[field.field]}
          allValues={values}
        />
      </div>
    </div>
  );

  const renderSection = (title: string, sectionFields: ClientField<[]>[]) => {
    if (sectionFields.length === 0) return null;

    // Deduplicate fields
    const reducedFields = sectionFields.reduce(
      (acc, cur) => (acc.map((f) => f.field).includes(cur.field) ? acc : [...acc, cur]),
      [] as ClientField<[]>[]
    );

    // Get indices for fields in this section within filteredFields
    const sectionFieldIndices = reducedFields.map((f) =>
      filteredFields.findIndex((pf) => pf.field === f.field)
    );

    return (
      <div key={title} className="space-y-3">
        <div className="pt-2 pb-1">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        

        <div className="space-y-3">
          {reducedFields.map((field, idx) => {
            const actualIndex = sectionFieldIndices[idx];
            return actualIndex >= 0 ? renderField(field, actualIndex) : null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          ✓ Drag fields to reorder them while testing. Fill in values to see form behavior.
        </p>
      </div>
      {renderSection("Entity Information", entitySectionFields)}
      {renderSection("Internship Information", internshipSectionFields)}
      {renderSection("University Information", universitySectionFields)}
      {renderSection("Student Information", studentSectionFields)}
      {recipientFields.length > 0 &&
        renderSection("Recipient Email(s) — IMPORTANT", recipientFields)}
    </div>
  );
};
