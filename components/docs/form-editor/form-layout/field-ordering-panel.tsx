"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Copy } from "lucide-react";
import type { FormField } from "../field-box";

interface FieldOrderingPanelProps {
  fields: FormField[];
  onFieldsReorder: (fields: FormField[]) => void;
}

export const FieldOrderingPanel = ({ fields, onFieldsReorder }: FieldOrderingPanelProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [items, setItems] = useState<FormField[]>(fields);

  // Update items when fields prop changes
  React.useEffect(() => {
    setItems(fields);
  }, [fields]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => {
      if (draggedIndex === null || draggedIndex === index) return;

      const newItems = [...items];
      const draggedItem = newItems[draggedIndex];
      newItems.splice(draggedIndex, 1);
      newItems.splice(index, 0, draggedItem);

      setDraggedIndex(index);
      setItems(newItems);
    },
    [draggedIndex, items]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    onFieldsReorder(items);
  }, [items, onFieldsReorder]);

  const handleDeleteField = useCallback(
    (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      onFieldsReorder(newItems);
    },
    [items, onFieldsReorder]
  );

  const handleDuplicateField = useCallback(
    (index: number) => {
      const field = items[index];
      const newField: FormField = {
        ...field,
        label: `${field.label} (copy)`,
      };
      const newItems = [...items.slice(0, index + 1), newField, ...items.slice(index + 1)];
      setItems(newItems);
      onFieldsReorder(newItems);
    },
    [items, onFieldsReorder]
  );

  return (
    <div className="space-y-4">
      <Card className="border border-blue-200 bg-blue-50/50 p-4">
        <p className="text-xs text-blue-700">
          Drag fields to reorder them. The order here will be used when rendering forms.
        </p>
      </Card>

      {items.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-slate-500">No fields to order</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((field, index) => (
            <div
              key={`${field.field}:${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={() => handleDragOver(index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                draggedIndex === index
                  ? "border-blue-300 bg-blue-100 opacity-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              } `}
            >
              <GripVertical className="h-4 w-4 flex-shrink-0 cursor-move text-slate-400" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{field.label}</p>
                <p className="text-xs text-slate-500">
                  {field.field} • Page {field.page}
                </p>
              </div>

              <div className="flex-shrink-0 text-xs text-slate-500">{index + 1}</div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicateField(index)}
                  title="Duplicate field"
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteField(index)}
                  title="Delete field"
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React from "react";
