/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-21 13:29:40
 * @ Description: PDF Form Editor Page
 *                Orchestrates form editor state with block-centric metadata management
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { useModal } from "@/app/providers/modal-provider";
import { PdfViewer } from "../../../../../components/docs/form-editor/form-pdf-editor/PdfViewer";
import { EditorSidebar } from "../../../../../components/docs/form-editor/EditorSidebar";
import { FormLayoutEditor } from "../../../../../components/docs/form-editor/form-layout/FormLayoutEditor";
import { FieldRegistrationModalContent } from "@/components/docs/form-editor/FieldRegistrationModalContent";
import { useFieldOperations } from "../../../../../hooks/use-field-operations";
import { useFieldRegistration } from "../../../../../hooks/use-field-registration";
import { useFormsControllerGetFieldRegistry } from "@/app/api";
import { getFieldLabelByName } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import {
  FormMetadata,
  DUMMY_FORM_METADATA,
  type IFormBlock,
  type IFormField,
  ClientBlock,
} from "@betterinternship/core/forms";
import type { FormField } from "../../../../../components/docs/form-editor/form-pdf-editor/FieldBox";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X, Layout } from "lucide-react";

const PdfJsEditorPage = () => {
  const { data: fieldRegistryData } = useFormsControllerGetFieldRegistry();
  const registry = fieldRegistryData?.fields ?? [];

  // Initialize FormMetadata with dummy data
  const formMetadata = useMemo(() => new FormMetadata(DUMMY_FORM_METADATA), []);

  // Extract initial fields from blocks
  const INITIAL_FIELDS: FormField[] = useMemo(
    () =>
      formMetadata.getFields().map((field: IFormField) => ({
        field: field.field,
        label: field.label,
        page: field.page,
        x: field.x,
        y: field.y,
        w: field.w,
        h: field.h,
        align_h: field.align_h ?? "left",
        align_v: field.align_v ?? "top",
      })),
    [formMetadata]
  );

  const { openModal, closeModal } = useModal();

  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [fields, setFields] = useState<FormField[]>(INITIAL_FIELDS);
  const [isPlacingField, setIsPlacingField] = useState<boolean>(false);
  const [placementFieldType, setPlacementFieldType] = useState<string>("text");
  const [placementAlign_h, setPlacementAlign_h] = useState<"left" | "center" | "right">("left");
  const [placementAlign_v, setPlacementAlign_v] = useState<"top" | "middle" | "bottom">("top");
  const [formLabel, setFormLabel] = useState<string>(formMetadata.getLabel());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingNameValue, setEditingNameValue] = useState<string>(formLabel);
  const [activeView, setActiveView] = useState<"pdf" | "layout">("pdf");
  const [blocks, setBlocks] = useState<ClientBlock<[]>[]>(
    formMetadata.getAllBlocksForClientService()
  );

  // Field operations
  const fieldOps = useFieldOperations(fields, setFields, setSelectedFieldId, selectedFieldId);

  // Field registration
  const { registerFields } = useFieldRegistration(DUMMY_FORM_METADATA.name, formLabel);

  /**
   * Sync blocks when fields change
   */
  const syncBlocksWithFields = useCallback(
    (updatedFields: FormField[]) => {
      const newBlocks = blocks.map((block) => {
        if (block.block_type === "form_field") {
          const content = block.content as IFormField;
          const updatedField = updatedFields.find((f) => f.field === content.field);
          if (updatedField) {
            return {
              ...block,
              content: {
                ...content,
                x: updatedField.x,
                y: updatedField.y,
                w: updatedField.w,
                h: updatedField.h,
                align_h: updatedField.align_h,
                align_v: updatedField.align_v,
                label: updatedField.label,
              },
            };
          }
        }
        return block;
      });
      setBlocks(newBlocks);
    },
    [blocks]
  );

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
      syncBlocksWithFields(newFields);
    },
    [fields, syncBlocksWithFields]
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
        align_h: placementAlign_h,
        align_v: placementAlign_v,
      };
      fieldOps.create(fieldWithLabel);

      // Add new block for this field
      const newBlock: IFormBlock = {
        block_type: "form_field",
        order: blocks.length,
        content: {
          field: newField.field,
          type: placementFieldType as "text" | "signature" | "image",
          x: newField.x,
          y: newField.y,
          w: newField.w,
          h: newField.h,
          page: newField.page,
          align_h: placementAlign_h,
          align_v: placementAlign_v,
          label: fieldWithLabel.label,
          tooltip_label: fieldWithLabel.label,
          shared: true,
          source: "manual",
          validator: 'z.string().min(1, "Field is required")',
        } as IFormField,
        party_id: blocks[0]?.party_id ?? "party-1",
      };
      setBlocks([...blocks, newBlock]);
      setIsPlacingField(false);
    },
    [fieldOps, registry, placementAlign_h, placementAlign_v, blocks]
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
        syncBlocksWithFields(newFields);
      }
    },
    [selectedFieldId, fields, syncBlocksWithFields]
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
  const handleRegisterForm = useCallback(() => {
    // Create updated metadata with current blocks
    const updatedMetadata = {
      ...DUMMY_FORM_METADATA,
      label: formLabel,
      schema: {
        ...DUMMY_FORM_METADATA.schema,
        blocks: blocks,
      },
    };

    const result = registerFields(fields);

    openModal(
      "field-registration-modal",
      <FieldRegistrationModalContent
        metadata={result.metadata}
        errors={result.errors}
        onClose={() => closeModal("field-registration-modal")}
        onConfirm={(editedMetadata) => {
          console.log("Registering metadata:", editedMetadata);
          console.log("Updated blocks:", blocks);
          // TODO: Send metadata and blocks to backend API
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
          syncBlocksWithFields(fieldsWithLabels);
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
  }, [
    fields,
    blocks,
    formLabel,
    registerFields,
    openModal,
    closeModal,
    registry,
    syncBlocksWithFields,
  ]);

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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView(activeView === "pdf" ? "layout" : "pdf")}
            className="flex items-center gap-2"
          >
            {activeView === "pdf" ? (
              <>
                <Layout className="h-4 w-4" />
                Switch to Form Editor
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Switch to PDF Editor
              </>
            )}
          </Button>
          <Button onClick={handleRegisterForm}>Register Form</Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === "pdf" ? (
          // PDF Editor View
          <div className="flex h-full gap-0">
            {/* PDF Viewer (left, main) */}
            <div className="flex-1">
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
                placementAlign_h={placementAlign_h}
                placementAlign_v={placementAlign_v}
                onAlignmentChange={(alignment) => {
                  setPlacementAlign_h(alignment.align_h);
                  setPlacementAlign_v(alignment.align_v);
                }}
                registry={registry}
              />
            </div>
          </div>
        ) : (
          // Form Layout Editor View
          <FormLayoutEditor
            fields={fields}
            formLabel={formLabel}
            onFieldsReorder={(reorderedFields) => {
              setFields(reorderedFields);
              syncBlocksWithFields(reorderedFields);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PdfJsEditorPage;
