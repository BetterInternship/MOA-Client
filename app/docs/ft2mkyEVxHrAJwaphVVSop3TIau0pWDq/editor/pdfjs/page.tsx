/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified time: 2025-12-18 15:34:20
 * @ Modified time: 2025-12-18 16:09:24
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
import { getFieldLabel } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import type { FormField } from "../../../../../components/docs/form-editor/field-box";
import { Button } from "@/components/ui/button";

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

  // Field operations
  const fieldOps = useFieldOperations(fields, setFields, setSelectedFieldId, selectedFieldId);

  // Field registration
  const { registerFields } = useFieldRegistration("Love, Joy, Hope", "LJH Form");

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
      // Look up the label from registry
      const fieldWithLabel: FormField = {
        ...newField,
        label: getFieldLabel(newField.field, registry),
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
          setFields(updatedFields);
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
        <h1 className="text-lg leading-tight font-semibold">Love, Joy, Hope</h1>
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
