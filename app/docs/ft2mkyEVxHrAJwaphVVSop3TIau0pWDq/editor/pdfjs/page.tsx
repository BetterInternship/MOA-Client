/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-18 18:41:41
 * @ Description: PDF Form Editor Page
 *                Orchestrates form editor state with field management
 */

"use client";

import { useState, useCallback } from "react";
import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { useModal } from "@/app/providers/modal-provider";
import { PdfViewer } from "../../../../../components/docs/form-editor/pdf-viewer";
import { EditorSidebar } from "../../../../../components/docs/form-editor/editor-sidebar";
import { FieldRegistrationModalContent } from "@/components/docs/form-editor/field-registration-modal";
import { useFieldOperations } from "../../../../../hooks/use-field-operations";
import { useFieldRegistration } from "../../../../../hooks/use-field-registration";
import { useFormsControllerGetFieldRegistry } from "@/app/api";
import { getFieldLabelByName } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import type { FormField } from "../../../../../components/docs/form-editor/field-box";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from "lucide-react";

// Sample
const INITIAL_FIELDS: FormField[] = [
  { field: "signature", label: "Sherwin's Signature", page: 1, x: 72.3, y: 9.7, w: 466, h: 60 },
];

const PdfJsEditorPage = () => {
  const { data: fieldRegistryData } = useFormsControllerGetFieldRegistry();
  console.log("Field Registry Data", fieldRegistryData);
  const registry = fieldRegistryData?.fields ?? [];
  console.log("Registry", registry);

  const { openModal, closeModal } = useModal();

  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [fields, setFields] = useState<FormField[]>(INITIAL_FIELDS);
  const [isPlacingField, setIsPlacingField] = useState<boolean>(false);
  const [placementFieldType, setPlacementFieldType] = useState<string>("signature");
  const [formLabel, setFormLabel] = useState<string>("Love, Joy, Hope");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingNameValue, setEditingNameValue] = useState<string>(formLabel);

  // Field operations
  const fieldOps = useFieldOperations(fields, setFields, setSelectedFieldId, selectedFieldId);

  // Field registration
  const { registerFields } = useFieldRegistration("LJH Form", formLabel);

  /**
   * Live field update during drag
   */
  const handleFieldUpdate = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      const newFields = fields.map((f, idx) => {
        const currentId = `${f.field}:${idx}`;
        return currentId === fieldId ? { ...f, ...updates } : f;
      });
      setFields(newFields);
    },
    [fields]
  );

  /**
   * Handle field creation with auto-selection
   */
  const handleFieldCreate = useCallback(
    (newField: FormField) => {
      // Look up the label from registry using field name
      const fieldWithLabel: FormField = {
        ...newField,
        label: getFieldLabelByName(newField.field, registry),
      };
      fieldOps.create(fieldWithLabel);
      setIsPlacingField(false);
    },
    [fieldOps, registry]
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
        setFields(newFields);
      }
    },
    [selectedFieldId, fields]
  );

  /**
   * Handle form name edit
   */
  const handleSaveFormName = useCallback(() => {
    if (editingNameValue.trim()) {
      setFormLabel(editingNameValue.trim());
      setIsEditingName(false);
    }
  }, [editingNameValue]);

  const handleCancelNameEdit = useCallback(() => {
    setEditingNameValue(formLabel);
    setIsEditingName(false);
  }, [formLabel]);

  const handleStartEditName = useCallback(() => {
    setEditingNameValue(formLabel);
    setIsEditingName(true);
  }, [formLabel]);

  /**
   * Handle field registration - molds fields to metadata and opens global modal
   */
  const handleRegisterFields = useCallback(() => {
    const result = registerFields(fields);

    openModal(
      "field-registration-modal",
      <FieldRegistrationModalContent
        metadata={result.metadata}
        errors={result.errors}
        onClose={() => closeModal("field-registration-modal")}
        onConfirm={(editedMetadata) => {
          console.log("Registering metadata:", editedMetadata);
          // TODO: Send metadata to backend API
          closeModal("field-registration-modal");
        }}
        onFieldsUpdate={(updatedFields) => {
          // Update fields in real-time as JSON is edited
          // Enrich fields with labels from registry
          const fieldsWithLabels = updatedFields.map((field) => ({
            ...field,
            label: getFieldLabelByName(field.field, registry),
          }));
          setFields(fieldsWithLabels);
        }}
      />,
      {
        title: "Field Registration",
        allowBackdropClick: true,
        hasClose: true,
        closeOnEsc: true,
        panelClassName: "!w-5xl",
      }
    );
  }, [fields, registerFields, openModal, closeModal]);

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-3">
        {isEditingName ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editingNameValue}
              onChange={(e) => setEditingNameValue(e.target.value)}
              onBlur={handleSaveFormName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveFormName();
                if (e.key === "Escape") handleCancelNameEdit();
              }}
              autoFocus
              className="w-80 rounded border border-blue-500 px-2 py-1 text-lg font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            <button
              onClick={handleSaveFormName}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-green-100 hover:text-green-600"
              title="Save (Enter)"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancelNameEdit}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"
              title="Cancel (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-lg leading-tight font-semibold">{formLabel}</h1>
            <button
              onClick={handleStartEditName}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Edit form name"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        )}
        <Button onClick={handleRegisterFields}>Register Fields</Button>
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
              registry={registry}
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
            registry={registry}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfJsEditorPage;
