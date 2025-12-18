"use client";

import { FormField } from "./PdfViewer";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";

type FieldListPanelProps = {
  fields: FormField[];
  selectedFieldId?: string;
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
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      <div className="text-muted-foreground text-xs font-semibold">Fields ({fields.length})</div>
      <div className="flex-1 space-y-1.5 overflow-y-scroll pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent">
        {fields.length === 0 ? (
          <div className="border-muted-foreground/30 bg-muted/30 text-muted-foreground rounded border border-dashed p-3 text-center text-xs">
            No fields yet. Use the Placement tab to add fields.
          </div>
        ) : (
          fields.map((field, idx) => {
            const fieldId = `${field.field}:${idx}`;
            const isSelected = selectedFieldId === fieldId;
            return (
              <div
                key={fieldId}
                onClick={() => onFieldSelect(fieldId)}
                className={`cursor-pointer rounded-[0.33em] p-2 transition-colors ${
                  isSelected ? "bg-blue-100" : "hover:bg-slate-150 bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-700">{field.label}</div>
                    <div className="text-muted-foreground text-xs">
                      page {field.page} • ({field.x.toFixed(1)}, {field.y.toFixed(1)},{" "}
                      {field.w.toFixed(1)}, {field.h.toFixed(1)})
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => onFieldDuplicate(fieldId)}
                      variant="ghost"
                      size="xs"
                      title="Duplicate field"
                      className="h-6 w-6 p-0 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => onFieldDelete(fieldId)}
                      variant="ghost"
                      size="xs"
                      title="Delete field"
                      className="h-6 w-6 p-0 text-slate-500 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
