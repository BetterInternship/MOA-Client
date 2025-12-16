/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 23:20:39
 * @ Description: pdfjs-based form editor page
 */

"use client";

import { useState } from "react";
import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { PdfViewer } from "../../../../../components/docs/form-editor/pdf-viewer";
import { EditorSidebar } from "../../../../../components/docs/form-editor/_components/editor-sidebar";
import type { FormField } from "../../../../../components/docs/form-editor/_components/field-box";

const PdfJsEditorPage = () => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [fields, setFields] = useState<FormField[]>([
    { field: "signature", page: 1, x: 72.3, y: 9.7, w: 466, h: 60 },
  ]);
  const [isPlacingField, setIsPlacingField] = useState<boolean>(false);
  const [placementFieldType, setPlacementFieldType] = useState<string>("signature");

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f, idx) => {
        const currentId = `${f.field}:${idx}`;
        return currentId === fieldId ? { ...f, ...updates } : f;
      })
    );
  };

  const handleFieldCreate = (newField: FormField) => {
    setFields((prev) => [...prev, newField]);
    // Auto-select the new field: find its ID by index
    const newFieldIndex = fields.length;
    setSelectedFieldId(`${newField.field}:${newFieldIndex}`);
    // Exit placement mode
    setIsPlacingField(false);
  };

  const handleFieldDelete = (fieldId: string) => {
    // ! REFACTOR: This is a simple implementation. In a real app, you'd want to preserve indices or use UUIDs
    setFields((prev) => {
      const targetIdx = parseInt(fieldId.split(":")[1], 10);
      return prev.filter((_, idx) => idx !== targetIdx);
    });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId("");
    }
  };

  const handleFieldDuplicate = (fieldId: string) => {
    const targetIdx = parseInt(fieldId.split(":")[1], 10);
    const fieldToDuplicate = fields[targetIdx];
    if (!fieldToDuplicate) return;

    // Create a duplicate with slightly offset position
    const duplicated: FormField = {
      ...fieldToDuplicate,
      x: fieldToDuplicate.x + 20,
      y: fieldToDuplicate.y + 20,
    };

    setFields((prev) => [...prev, duplicated]);
    const newFieldIndex = fields.length;
    setSelectedFieldId(`${duplicated.field}:${newFieldIndex}`);
  };

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-3">
        <h1 className="text-lg leading-tight font-semibold">Love, Joy, Hope</h1>
      </div>

      {/* Main content: Sidebar + Viewer */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* PDF Viewer (left, main) */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<Loader>Loading PDF…</Loader>}>
            <PdfViewer
              fields={fields}
              selectedFieldId={selectedFieldId}
              onFieldSelect={setSelectedFieldId}
              onFieldUpdate={handleFieldUpdate}
              onFieldCreate={handleFieldCreate}
              isPlacingField={isPlacingField}
              placementFieldType={placementFieldType}
              onPlacementFieldTypeChange={setPlacementFieldType}
              onStartPlacing={() => setIsPlacingField(true)}
              onCancelPlacing={() => setIsPlacingField(false)}
            />
          </Suspense>
        </div>

        {/* Sidebar (right) */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-l bg-white">
          <EditorSidebar
            fields={fields}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
            onFieldDelete={handleFieldDelete}
            onFieldDuplicate={handleFieldDuplicate}
            isPlacing={isPlacingField}
            placementFieldType={placementFieldType}
            onFieldTypeChange={setPlacementFieldType}
            onStartPlacing={() => setIsPlacingField(true)}
            onCancelPlacing={() => {
              setIsPlacingField(false);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfJsEditorPage;
