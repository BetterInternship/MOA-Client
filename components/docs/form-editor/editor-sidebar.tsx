/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:07:53
 * @ Modified by: Your name
 * @ Modified time: 2025-12-18 18:45:43
 * @ Description: Editor sidebar component
 */

"use client";

import { FieldListPanel } from "./field-list-panel";
import { PlacementControl } from "./placement-control";
import type { FormField } from "./pdf-viewer";
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
  registry?: FieldRegistryEntry[];
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
  registry = [],
}: EditorSidebarProps) => {
  const selectedField = fields.find((f, idx) => `${f.field}:${idx}` === selectedFieldId);

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
          onCoordinatesChange={onCoordinatesChange}
          registry={registry}
        />
      </div>

      {/* Field List */}
      <FieldListPanel
        fields={fields}
        selectedFieldId={selectedFieldId}
        onFieldSelect={onFieldSelect}
        onFieldDelete={onFieldDelete}
        onFieldDuplicate={onFieldDuplicate}
      />
    </div>
  );
};
