"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldListPanel } from "./field-list-panel";
import type { FormField } from "../pdf-viewer";
import { PlacementControl } from "./placement-control";
import { List, Settings } from "lucide-react";

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
}: EditorSidebarProps) => {
  const selectedField = fields.find((f, idx) => `${f.field}:${idx}` === selectedFieldId);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden bg-slate-50/50 p-3">
      <Tabs defaultValue="fields" className="flex flex-1 flex-col gap-2 overflow-hidden">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields" className="text-xs" title="Manage fields">
            <List className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs" title="Settings">
            <Settings className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {/* Fields Tab - with placement control + field list combined */}
        <TabsContent value="fields" className="mt-0 flex-1 space-y-4 overflow-y-auto">
          {/* Placement Control */}
          <div className="space-y-2 rounded-md border border-dashed border-slate-300 bg-white p-2">
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

          {/* Selected Field Details */}
          {selectedField && (
            <div className="border-primary/30 bg-primary/5 space-y-2 rounded-md border p-2 text-xs">
              <div className="text-primary font-semibold">{selectedField.field}</div>
              <div className="text-muted-foreground grid grid-cols-2 gap-1">
                <div>Page: {selectedField.page}</div>
                <div>X: {selectedField.x.toFixed(1)}</div>
                <div>Y: {selectedField.y.toFixed(1)}</div>
                <div>W: {selectedField.w.toFixed(1)}</div>
                <div>H: {selectedField.h.toFixed(1)}</div>
              </div>
              <div className="flex gap-1 pt-1">
                <button
                  onClick={() => onFieldDuplicate(selectedFieldId)}
                  className="flex-1 rounded bg-slate-200 px-2 py-1 text-xs font-medium transition-colors hover:bg-slate-300"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => onFieldDelete(selectedFieldId)}
                  className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-0 flex-1 overflow-y-auto">
          <div className="text-muted-foreground p-4 text-xs">Settings coming soon...</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
