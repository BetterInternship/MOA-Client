"use client";

import { cn } from "@/lib/utils";
import { FormField } from "./pdf-viewer";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type FieldListPanelProps = {
  fields: FormField[];
  selectedFieldId: string;
  onFieldSelect: (fieldId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
};

export const FieldListPanel = ({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldDelete,
  onFieldDuplicate,
}: FieldListPanelProps) => {
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-xs font-semibold">Fields ({fields.length})</div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {fields.length === 0 ? (
          <div className="border-muted-foreground/30 bg-muted/30 text-muted-foreground rounded border border-dashed p-3 text-center text-xs">
            No fields yet. Use the Placement tab to add fields.
          </div>
        ) : (
          fields.map((field, idx) => {
            const fieldId = `${field.field}:${idx}`;
            const isSelected = fieldId === selectedFieldId;
            return (
              <div
                key={fieldId}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-[0.33em] px-2 py-2 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
                onClick={() => onFieldSelect(fieldId)}
              >
                <div className="flex-1 truncate">
                  <div>{field.field}</div>
                  <div className="text-xs opacity-75">p{field.page}</div>
                </div>
                <div className="flex gap-0.5">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFieldDuplicate(fieldId);
                    }}
                    variant="ghost"
                    size="xs"
                    title="Duplicate field"
                    className={cn(
                      "cursor-pointer p-1.5 text-slate-500 hover:bg-transparent",
                      isSelected && "text-white hover:text-slate-500"
                    )}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFieldDelete(fieldId);
                    }}
                    variant="ghost"
                    size="xs"
                    title="Delete field"
                    className={cn(
                      "hover:text-destructive cursor-pointer p-1.5 text-slate-500 hover:bg-transparent",
                      isSelected && "text-white"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
