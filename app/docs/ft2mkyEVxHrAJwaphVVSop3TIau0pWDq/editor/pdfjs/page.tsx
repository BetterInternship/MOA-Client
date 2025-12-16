/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 23:41:54
 * @ Description: pdfjs-based form editor page
 */

"use client";

import { useState, useRef } from "react";
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
  const [historyState, setHistoryState] = useState({
    history: [[{ field: "signature", page: 1, x: 72.3, y: 9.7, w: 466, h: 60 }]],
    index: 0,
  });
  const dragStartStateRef = useRef<FormField[] | null>(null);

  const updateFieldsWithHistory = (newFields: FormField[]) => {
    setHistoryState((prev) => {
      const newHistory = prev.history.slice(0, prev.index + 1);
      newHistory.push(newFields);
      return { history: newHistory, index: newHistory.length - 1 };
    });
    setFields(newFields);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    // Direct update without history (for live dragging)
    // On first drag, save the state before changes
    if (!dragStartStateRef.current) {
      dragStartStateRef.current = JSON.parse(JSON.stringify(fields)) as FormField[];
    }

    const newFields = fields.map((f, idx) => {
      const currentId = `${f.field}:${idx}`;
      return currentId === fieldId ? { ...f, ...updates } : f;
    });
    setFields(newFields);
  };

  const handleFieldUpdateFinal = () => {
    // Only add to history if we were dragging
    if (dragStartStateRef.current) {
      updateFieldsWithHistory(fields);
      dragStartStateRef.current = null;
    }
  };

  const handleFieldCreate = (newField: FormField) => {
    const newFields = [...fields, newField];
    updateFieldsWithHistory(newFields);
    // Auto-select the new field
    const newFieldIndex = newFields.length - 1;
    setSelectedFieldId(`${newField.field}:${newFieldIndex}`);
    // Exit placement mode
    setIsPlacingField(false);
  };

  const handleFieldDelete = (fieldId: string) => {
    const targetIdx = parseInt(fieldId.split(":")[1], 10);
    const newFields = fields.filter((_, idx) => idx !== targetIdx);
    updateFieldsWithHistory(newFields);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId("");
    }
  };

  const handleFieldDuplicate = (fieldId: string) => {
    const targetIdx = parseInt(fieldId.split(":")[1], 10);
    const fieldToDuplicate = fields[targetIdx];
    if (!fieldToDuplicate) return;

    const duplicated: FormField = {
      ...fieldToDuplicate,
      x: fieldToDuplicate.x + 20,
      y: fieldToDuplicate.y + 20,
    };

    const newFields = [...fields, duplicated];
    updateFieldsWithHistory(newFields);
    const newFieldIndex = newFields.length - 1;
    setSelectedFieldId(`${duplicated.field}:${newFieldIndex}`);
  };

  const handleUndo = () => {
    if (historyState.index > 0) {
      const newIndex = historyState.index - 1;
      setHistoryState((prev) => ({ ...prev, index: newIndex }));
      setFields(historyState.history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyState.index < historyState.history.length - 1) {
      const newIndex = historyState.index + 1;
      setHistoryState((prev) => ({ ...prev, index: newIndex }));
      setFields(historyState.history[newIndex]);
    }
  };

  const handleCoordinatesChange = (coords: { x: number; y: number; w: number; h: number }) => {
    if (selectedFieldId) {
      // Direct update with history (for numeric input changes)
      const newFields = fields.map((f, idx) => {
        const currentId = `${f.field}:${idx}`;
        return currentId === selectedFieldId ? { ...f, ...coords } : f;
      });
      updateFieldsWithHistory(newFields);
    }
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
              onFieldUpdateFinal={handleFieldUpdateFinal}
              onFieldCreate={handleFieldCreate}
              isPlacingField={isPlacingField}
              placementFieldType={placementFieldType}
              onPlacementFieldTypeChange={setPlacementFieldType}
              onStartPlacing={() => setIsPlacingField(true)}
              onCancelPlacing={() => setIsPlacingField(false)}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyState.index > 0}
              canRedo={historyState.index < historyState.history.length - 1}
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
            onCoordinatesChange={handleCoordinatesChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfJsEditorPage;
