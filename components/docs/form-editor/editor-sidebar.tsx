/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:07:53
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 00:50:34
 * @ Description: Editor sidebar component
 */

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldListPanel } from "./field-list-panel";
import { PlacementControl } from "./placement-control";
import { SelectedFieldDetails } from "../form-editor/selected-field-details";
import type { FormField } from "./pdf-viewer";
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
      <Tabs defaultValue="fields" className="flex flex-1 flex-col overflow-hidden">
        <TabsList>
          <TabsTrigger value="fields" title="Manage fields">
            <List className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="settings" title="Settings">
            <Settings className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {/* Fields Tab */}
        <TabsContent value="fields" className="mt-0 flex-1 space-y-4 overflow-y-auto">
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
            <SelectedFieldDetails
              field={selectedField}
              fieldId={selectedFieldId}
              onDuplicate={onFieldDuplicate}
              onDelete={onFieldDelete}
            />
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
