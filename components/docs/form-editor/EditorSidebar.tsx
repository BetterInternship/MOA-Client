/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:07:53
 * @ Modified by: Your name
 * @ Modified time: 2025-12-18 19:24:13
 * @ Description: Editor sidebar component
 */

"use client";

import { FieldListPanel } from "./form-pdf-editor/FieldListPanel";
import { PlacementControl } from "./form-pdf-editor/PlacementControl";
import type { FormField } from "./form-pdf-editor/PdfViewer";
import type { FieldRegistryEntry } from "@/app/api";

type EditorSidebarProps = {
  fields: FormField[];
  selectedFieldId: string;
  onFieldSelect: (fieldId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
  isPlacing: boolean;
  placementFieldType: string;
  onFieldTypeChange: (type: string) => void;
  onStartPlacing: () => void;
  onCancelPlacing: () => void;
  onCoordinatesChange?: (coords: { x: number; y: number; w: number; h: number }) => void;
  placementAlign_h?: "left" | "center" | "right";
  placementAlign_v?: "top" | "middle" | "bottom";
  onAlignmentChange?: (alignment: {
    align_h: "left" | "center" | "right";
    align_v: "top" | "middle" | "bottom";
  }) => void;
  registry?: FieldRegistryEntry[];
  onFieldClickInSidebar?: (fieldId: string) => void;
};

export const EditorSidebar = ({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldDelete,
  onFieldDuplicate,
  isPlacing,
  placementFieldType,
  onFieldTypeChange,
  onStartPlacing,
  onCancelPlacing,
  onCoordinatesChange,
  placementAlign_h = "center",
  placementAlign_v = "middle",
  onAlignmentChange,
  registry = [],
  onFieldClickInSidebar,
}: EditorSidebarProps) => {
  // Find selected field by _id
  const selectedField = fields.find((f) => (f._id || `${f.field}:${f.page}`) === selectedFieldId);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden bg-slate-50/50 p-3">
      {/* Add Field Section */}
      <div className="space-y-2 rounded-[0.33em] border border-slate-300 bg-white p-2">
        <div className="text-xs font-semibold text-slate-700">Add Field</div>
        <PlacementControl
          isPlacing={isPlacing}
          fieldType={placementFieldType}
          onFieldTypeChange={onFieldTypeChange}
          onStartPlacing={onStartPlacing}
          onCancelPlacing={onCancelPlacing}
          x={selectedField?.x}
          y={selectedField?.y}
          w={selectedField?.w}
          h={selectedField?.h}
          align_h={placementAlign_h}
          align_v={placementAlign_v}
          onCoordinatesChange={onCoordinatesChange}
          onAlignmentChange={onAlignmentChange}
          registry={registry}
        />
      </div>

      {/* Field List */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <FieldListPanel
          fields={fields}
          selectedFieldId={selectedFieldId}
          onFieldSelect={onFieldSelect}
          onFieldDelete={onFieldDelete}
          onFieldDuplicate={onFieldDuplicate}
          onFieldClick={onFieldClickInSidebar}
        />
      </div>
    </div>
  );
};
