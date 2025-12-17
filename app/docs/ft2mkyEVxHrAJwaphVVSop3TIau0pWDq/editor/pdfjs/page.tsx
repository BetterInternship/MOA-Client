/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 13:44:29
 * @ Description: PDF Form Editor Page
 *                Orchestrates form editor state with field management and undo/redo
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { PdfViewer } from "../../../../../components/docs/form-editor/pdf-viewer";
import { EditorSidebar } from "../../../../../components/docs/form-editor/editor-sidebar";
import { useFormHistory } from "../../../../../hooks/use-form-history";
import { useFieldOperations } from "../../../../../hooks/use-field-operations";
import type { FormField } from "../../../../../components/docs/form-editor/field-box";

// Sample
const INITIAL_FIELDS: FormField[] = [
  { field: "signature", page: 1, x: 72.3, y: 9.7, w: 466, h: 60 },
];

const PdfJsEditorPage = () => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [fields, setFields] = useState<FormField[]>(INITIAL_FIELDS);
  const [isPlacingField, setIsPlacingField] = useState<boolean>(false);
  const [placementFieldType, setPlacementFieldType] = useState<string>("signature");
  const dragStartStateRef = useRef<FormField[] | null>(null);

  const { historyState, updateFieldsWithHistory, undo, redo, canUndo, canRedo } =
    useFormHistory(INITIAL_FIELDS);

  // Callback when history state changes
  const handleHistoryChange = useCallback(
    (newFields: FormField[]) => {
      updateFieldsWithHistory(newFields);
      setFields(newFields);
    },
    [updateFieldsWithHistory]
  );

  // Field operations with history tracking
  const fieldOps = useFieldOperations(
    fields,
    handleHistoryChange,
    setSelectedFieldId,
    selectedFieldId
  );

  /**
   * Live field update during drag (no history)
   * Saves state snapshot on first drag
   */
  const handleFieldUpdate = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      // Save state snapshot on first drag
      if (!dragStartStateRef.current) {
        dragStartStateRef.current = JSON.parse(JSON.stringify(fields)) as FormField[];
      }

      const newFields = fields.map((f, idx) => {
        const currentId = `${f.field}:${idx}`;
        return currentId === fieldId ? { ...f, ...updates } : f;
      });
      setFields(newFields);
    },
    [fields]
  );

  /**
   * Finalize field update and add to history
   * Called when drag or resize completes
   */
  const handleFieldUpdateFinal = useCallback(() => {
    if (dragStartStateRef.current) {
      handleHistoryChange(fields);
      dragStartStateRef.current = null;
    }
  }, [fields, handleHistoryChange]);

  /**
   * Handle field creation with auto-selection
   */
  const handleFieldCreate = useCallback(
    (newField: FormField) => {
      fieldOps.create(newField);
      setIsPlacingField(false);
    },
    [fieldOps]
  );

  /**
   * Handle coordinate input changes
   */
  const handleCoordinatesChange = useCallback(
    (coords: { x: number; y: number; w: number; h: number }) => {
      if (selectedFieldId) {
        const newFields = fields.map((f, idx) => {
          const currentId = `${f.field}:${idx}`;
          return currentId === selectedFieldId ? { ...f, ...coords } : f;
        });
        handleHistoryChange(newFields);
      }
    },
    [selectedFieldId, fields, handleHistoryChange]
  );

  /**
   * Get current history state
   */
  const getCurrentFields = () => {
    return historyState.history[historyState.index] || [];
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
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </Suspense>
        </div>

        {/* Sidebar (right) */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-l bg-white">
          <EditorSidebar
            fields={fields}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
            onFieldDelete={fieldOps.delete}
            onFieldDuplicate={fieldOps.duplicate}
            isPlacing={isPlacingField}
            placementFieldType={placementFieldType}
            onFieldTypeChange={setPlacementFieldType}
            onStartPlacing={() => setIsPlacingField(true)}
            onCancelPlacing={() => setIsPlacingField(false)}
            onCoordinatesChange={handleCoordinatesChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfJsEditorPage;
