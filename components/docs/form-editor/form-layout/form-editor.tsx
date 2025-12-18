"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import type { FormField } from "../field-box";

interface Party {
  id: string;
  name: string;
  type: "entity" | "student-guardian" | "university" | "student";
  email?: string;
  required: boolean;
}

interface Parameter {
  id: string;
  key: string;
  value: string;
  type: "text" | "number" | "date";
  required: boolean;
}

interface FormEditorProps {
  fields: FormField[];
  parties: Party[];
  parameters: Parameter[];
  onFieldsReorder?: (fields: FormField[]) => void;
}

/**
 * Merged form editor that combines form preview with draggable field reordering.
 * Fields are rendered as draggable blocks that can be reordered directly in the form view.
 */
export const FormEditor = ({ fields, parties, parameters, onFieldsReorder }: FormEditorProps) => {
  const [orderedFields, setOrderedFields] = useState<FormField[]>(fields);
  const [activeParty, setActiveParty] = useState<string>(parties[0]?.type || "entity");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Update orderedFields when fields prop changes
  React.useEffect(() => {
    setOrderedFields(fields);
  }, [fields]);

  const partyFields = orderedFields.filter(
    (f) => f.field.includes(activeParty) || !f.field.includes(":")
  );

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => {
      if (draggedIndex === null || draggedIndex === index) return;

      const newFields = [...partyFields];
      const draggedItem = newFields[draggedIndex];
      newFields.splice(draggedIndex, 1);
      newFields.splice(index, 0, draggedItem);

      setDraggedIndex(index);

      // Rebuild full ordered fields list
      const updatedOrderedFields = orderedFields.map((f) => {
        const newIndex = newFields.findIndex((nf) => nf.field === f.field && nf.page === f.page);
        return f;
      });

      setOrderedFields(updatedOrderedFields);
    },
    [draggedIndex, partyFields, orderedFields]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    onFieldsReorder?.(orderedFields);
  }, [orderedFields, onFieldsReorder]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Party Selection */}
      <Card className="border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Select Party</h3>
        <div className="flex flex-wrap gap-2">
          {parties.map((party) => (
            <Button
              key={party.id}
              variant={activeParty === party.type ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveParty(party.type)}
            >
              {party.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Draggable Form Fields */}
      <Card className="border border-slate-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Form Fields (Drag to Reorder)</h3>
        <div className="space-y-3">
          {partyFields.length === 0 ? (
            <p className="text-xs text-slate-500">No fields assigned to this party</p>
          ) : (
            partyFields.map((field, index) => (
              <div
                key={`${field.field}:${field.page}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={() => handleDragOver(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                  draggedIndex === index
                    ? "border-blue-300 bg-blue-100 opacity-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                {/* Drag Handle */}
                <GripVertical className="h-4 w-4 flex-shrink-0 cursor-move text-slate-400" />

                {/* Field Label */}
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {field.label}
                  </label>
                </div>

                {/* Position Indicator */}
                <div className="flex-shrink-0 text-xs text-slate-500">{index + 1}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Parameters Preview */}
      {parameters.length > 0 && (
        <Card className="border border-blue-200 bg-blue-50/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-blue-900">Parameters</h3>
          <div className="grid grid-cols-2 gap-3">
            {parameters.map((param) => (
              <div key={param.id}>
                <label className="mb-1 block text-xs font-medium text-blue-700">{param.key}</label>
                <input
                  type={param.type}
                  placeholder={param.key}
                  value={formValues[param.key] || ""}
                  onChange={(e) => handleFieldChange(param.key, e.target.value)}
                  className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

import React from "react";
