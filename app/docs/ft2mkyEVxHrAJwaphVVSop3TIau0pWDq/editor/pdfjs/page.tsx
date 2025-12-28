/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-28 16:10:45
 *                Orchestrates form editor state with block-centric metadata management
 */

"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { useModal } from "@/app/providers/modal-provider";
import { useSearchParams } from "next/navigation";
import { PdfViewer } from "../../../../../components/docs/form-editor/form-pdf-editor/PdfViewer";
import { EditorSidebar } from "../../../../../components/docs/form-editor/EditorSidebar";
import { FormLayoutEditor } from "../../../../../components/docs/form-editor/form-layout/FormLayoutEditor";
import { FieldRegistrationModalContent } from "@/components/docs/form-editor/FieldRegistrationModalContent";
import { useFieldOperations } from "../../../../../hooks/use-field-operations";
import { useFieldRegistration } from "../../../../../hooks/use-field-registration";
import {
  useFormsControllerGetFieldRegistry,
  useFormsControllerGetRegistryFormMetadata,
  useFormsControllerGetRegistryFormDocument,
} from "@/app/api";
import { getFieldLabelByName } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import {
  FormMetadata,
  DUMMY_FORM_METADATA,
  type IFormBlock,
  type IFormField,
  type IFormMetadata,
} from "@betterinternship/core/forms";
import type { FormField } from "../../../../../components/docs/form-editor/form-pdf-editor/FieldBox";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X, Layout } from "lucide-react";
import {
  formsControllerRegisterForm,
  formsControllerGetFieldFromRegistry,
} from "../../../../api/app/api/endpoints/forms/forms";

// Utility to generate unique IDs for blocks
const generateBlockId = () => `block-${Math.random().toString(36).substr(2, 9)}`;

// Blank form metadata for new forms
const BLANK_FORM_METADATA: IFormMetadata = {
  name: "new-form",
  label: "New Form",
  schema_version: 1,
  schema: {
    blocks: [],
  },
  signing_parties: [],
  subscribers: [],
};

const PdfJsEditorPage = () => {
  const searchParams = useSearchParams();
  const formName = searchParams.get("name");
  const formVersion = searchParams.get("version");
  const isNewForm = !formName && !formVersion;

  const { data: fieldRegistryData } = useFormsControllerGetFieldRegistry();
  const { data: registryFormMetadata, isLoading: metadataLoading } =
    useFormsControllerGetRegistryFormMetadata(
      formName && formVersion ? { name: formName, version: parseInt(formVersion) } : undefined
    );
  const { data: formDocumentData } = useFormsControllerGetRegistryFormDocument(
    formName && formVersion ? { name: formName, version: parseInt(formVersion) } : undefined
  );

  const registry = fieldRegistryData?.fields ?? [];

  // Initialize FormMetadata with loaded data or blank data for new forms
  const formMetadata = useMemo(() => {
    const data = ((registryFormMetadata?.formMetadata as any) ||
      (isNewForm ? BLANK_FORM_METADATA : DUMMY_FORM_METADATA)) as IFormMetadata;
    return new FormMetadata<[]>(data);
  }, [registryFormMetadata, isNewForm]);

  // Get all blocks from FormMetadata (includes headers, paragraphs, form fields, etc.)
  // Use raw block structure for form editing
  const ALL_BLOCKS_RAW = useMemo(() => {
    const metadataData =
      (registryFormMetadata?.formMetadata as any) ||
      (isNewForm ? BLANK_FORM_METADATA : DUMMY_FORM_METADATA);
    return metadataData.schema?.blocks || (isNewForm ? [] : DUMMY_FORM_METADATA.schema.blocks);
  }, [registryFormMetadata, isNewForm]);

  // Extract only form field blocks (non-phantom) for the PDF preview
  const INITIAL_FIELDS: FormField[] = useMemo(() => {
    return ALL_BLOCKS_RAW.filter(
      (block: any) => block.block_type === "form_field" && block.field_schema
    ).map((block: any) => {
      const field = block.field_schema as IFormField;
      return {
        id: "", // Will be populated from registry
        field: field.field,
        label: field.label,
        page: field.page,
        x: field.x,
        y: field.y,
        w: field.w,
        h: field.h,
        align_h: (field.align_h ?? "left") as "left" | "center" | "right",
        align_v: (field.align_v ?? "top") as "top" | "middle" | "bottom",
      };
    });
  }, [ALL_BLOCKS_RAW]);

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
  const [metadata, setMetadata] = useState<IFormMetadata>(
    ((registryFormMetadata?.formMetadata as any) ||
      (isNewForm ? BLANK_FORM_METADATA : DUMMY_FORM_METADATA)) as IFormMetadata
  );
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [debugSchemaInput, setDebugSchemaInput] = useState<string>("");
  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false);

  // Get document URL from form metadata (only for existing forms) or from uploaded PDF
  const documentUrl =
    uploadedPdfUrl || (isNewForm ? undefined : formDocumentData?.formDocument || undefined);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (uploadedPdfUrl) {
        URL.revokeObjectURL(uploadedPdfUrl);
      }
    };
  }, []);

  // Update metadata when registry data loads
  useEffect(() => {
    if (registryFormMetadata?.formMetadata) {
      const metadataData = registryFormMetadata.formMetadata as any as IFormMetadata;
      setMetadata(metadataData);
      const newFormMetadata = new FormMetadata(metadataData);
      setFormLabel(newFormMetadata.getLabel());
      setEditingNameValue(newFormMetadata.getLabel());

      // Update fields from loaded metadata
      const blocksData = metadataData.schema.blocks;
      const fieldsFromMetadata: FormField[] = blocksData
        .filter((block: any) => block.block_type === "form_field" && block.field_schema)
        .map((block: any) => {
          const field = block.field_schema as IFormField;
          return {
            id: "",
            field: field.field,
            label: field.label,
            page: field.page,
            x: field.x,
            y: field.y,
            w: field.w,
            h: field.h,
            align_h: (field.align_h ?? "left") as "left" | "center" | "right",
            align_v: (field.align_v ?? "top") as "top" | "middle" | "bottom",
          };
        });
      setFields(fieldsFromMetadata);
    }
  }, [registryFormMetadata]);

  // Get blocks from metadata
  const blocks = metadata.schema.blocks;

  // Field operations
  const fieldOps = useFieldOperations(fields, setFields, setSelectedFieldId, selectedFieldId);

  // Field registration
  const { registerFields } = useFieldRegistration(metadata.name, formLabel);

  /**
   * Handle PDF file upload - preserve URL for view switching
   */
  const handlePdfFileSelect = useCallback((file: File) => {
    setDocumentFile(file);
    // Create and store object URL so PDF persists across view changes
    const objectUrl = URL.createObjectURL(file);
    setUploadedPdfUrl(objectUrl);
  }, []);

  /**
   * Sync blocks when fields change
   */
  const syncBlocksWithFields = useCallback(
    (updatedFields: FormField[]) => {
      const newBlocks: IFormBlock[] = blocks.map((block) => {
        if (block.block_type === "form_field" && block.field_schema) {
          const fieldSchema = block.field_schema as IFormField;
          const updatedField = updatedFields.find((f) => f.field === fieldSchema.field);
          if (updatedField) {
            return {
              ...block,
              field_schema: {
                ...fieldSchema,
                x: updatedField.x,
                y: updatedField.y,
                w: updatedField.w,
                h: updatedField.h,
                align_h: updatedField.align_h,
                align_v: updatedField.align_v,
                label: updatedField.label,
              } as IFormField,
            } as IFormBlock;
          }
        }
        return block;
      });
      // Update metadata with synced blocks
      setMetadata({
        ...metadata,
        schema: {
          ...metadata.schema,
          blocks: newBlocks,
        },
      });
    },
    [blocks, metadata]
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
    async (newField: FormField) => {
      // Fetch full field details from registry including validator and prefiller
      let fullFieldData: any = null;
      console.log("Fetching field details for:", newField.field, newField.id);

      try {
        const { field } = await formsControllerGetFieldFromRegistry({ id: newField.id });
        fullFieldData = field;
      } catch (error) {
        console.error("Failed to fetch field details:", error);
      }

      // Look up the label from registry using field name
      const fieldWithLabel: FormField = {
        ...newField,
        label: getFieldLabelByName(newField.field, registry),
        align_h: placementAlign_h,
        align_v: placementAlign_v,
      };
      fieldOps.create(fieldWithLabel);

      // Add new block for this field
      const signingPartyId: string =
        blocks.length > 0 && blocks[0].signing_party_id
          ? (blocks[0].signing_party_id as string)
          : "party-1";

      const newBlock: IFormBlock = {
        block_type: "form_field",
        order: blocks.length,
        signing_party_id: signingPartyId,
        field_schema: {
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
          signing_party_id: signingPartyId,
          source: "manual",
          validator: fullFieldData?.validator || "",
          prefiller: fullFieldData?.prefiller || "",
        } as IFormField,
      };
      // Update metadata with new block
      setMetadata({
        ...metadata,
        schema: {
          ...metadata.schema,
          blocks: [...blocks, newBlock],
        },
      });
      setIsPlacingField(false);
    },
    [fieldOps, registry, placementAlign_h, placementAlign_v, blocks, metadata]
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
   * Handle schema injection for debugging
   */
  const handleInjectSchema = useCallback(() => {
    try {
      const parsed = JSON.parse(debugSchemaInput);

      if (!parsed.schema || !parsed.schema.blocks) {
        alert("Invalid schema structure. Must have schema.blocks");
        return;
      }

      // Extract fields from blocks - handle both field_schema (single) and fields (array) formats
      const injectedFields: FormField[] = [];
      parsed.schema.blocks.forEach((block: any) => {
        if (block.field_schema) {
          // Single field_schema format
          const fieldSchema = block.field_schema;
          injectedFields.push({
            field: fieldSchema.field,
            id: fieldSchema.field, // Use field name as id if not provided
            label: fieldSchema.label || fieldSchema.field,
            x: fieldSchema.x || 0,
            y: fieldSchema.y || 0,
            w: fieldSchema.w || 100,
            h: fieldSchema.h || 40,
            required: fieldSchema.required || false,
            readonly: fieldSchema.readonly || false,
          });
        } else if (block.fields && Array.isArray(block.fields)) {
          // Array of fields format
          block.fields.forEach((field: any) => {
            injectedFields.push({
              field: field.field,
              id: field.id || field.field,
              label: field.label || field.field,
              x: field.x || 0,
              y: field.y || 0,
              w: field.w || 100,
              h: field.h || 40,
              required: field.required || false,
              readonly: field.readonly || false,
            });
          });
        }
      });

      // Normalize metadata: ensure signing_parties and subscribers exist
      const normalizedMetadata: IFormMetadata = {
        name: parsed.name || "untitled",
        label: parsed.label || "Untitled Form",
        schema_version: parsed.schema_version || 1,
        schema: parsed.schema,
        signing_parties: parsed.signing_parties || parsed.signatories || [],
        subscribers: parsed.subscribers || [],
      };

      setMetadata(normalizedMetadata);
      setFields(injectedFields);
      setIsDebugModalOpen(false);
      setDebugSchemaInput("");
      alert(`Schema injected successfully! (${injectedFields.length} fields loaded)`);
    } catch (error) {
      alert(`Error parsing schema: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [debugSchemaInput]);

  /**
   * Handle field registration - molds fields to metadata and opens global modal
   */
  const handleRegisterForm = useCallback(() => {
    // Use uploaded file if available, otherwise use the current document URL (no file needed for update)
    const fileToSubmit = documentFile || null;

    const result = registerFields(fields);

    // Compute final order for all blocks based on their current position
    const blocksWithFinalOrder = metadata.schema.blocks.map((block, index) => ({
      ...block,
      order: index,
    }));

    // Merge result metadata with current metadata to preserve all blocks, signing_parties, and subscribers
    // Add base_document to the metadata for submission (only if a new file was uploaded)
    const baseMetadata: IFormMetadata & { base_document?: File } =
      result.metadata && result.isValid
        ? {
            ...result.metadata,
            schema: {
              ...result.metadata.schema,
              blocks: blocksWithFinalOrder, // Use all blocks with computed order
            },
            signing_parties: metadata.signing_parties,
            subscribers: metadata.subscribers,
            ...(fileToSubmit && { base_document: fileToSubmit }),
          }
        : {
            ...metadata,
            schema: {
              ...metadata.schema,
              blocks: blocksWithFinalOrder,
            },
            ...(fileToSubmit && { base_document: fileToSubmit }),
          };

    openModal(
      "field-registration-modal",
      <FieldRegistrationModalContent
        metadata={baseMetadata}
        errors={result.errors}
        onClose={() => closeModal("field-registration-modal")}
        onConfirm={(editedMetadata) => {
          // Ensure all blocks have _id and set order values based on array position
          const blocksWithIdsAndOrder = (editedMetadata.schema.blocks as any[]).map(
            (block: any, index: number) => ({
              ...block,
              _id: block._id || generateBlockId(),
              order: index, // Array position becomes the order
            })
          );

          const metadataWithDocument = {
            ...editedMetadata,
            schema: {
              ...editedMetadata.schema,
              blocks: blocksWithIdsAndOrder,
            },
            ...(fileToSubmit && { base_document: fileToSubmit }),
          };
          formsControllerRegisterForm(metadataWithDocument);
          closeModal("field-registration-modal");
        }}
        onFieldsUpdate={(updatedFields) => {
          // Update fields in real-time as JSON is edited
          const fieldsWithLabels = updatedFields.map((field) => ({
            ...field,
            id: field.id || "",
            label: getFieldLabelByName(field.field, registry),
          })) as FormField[];
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
    metadata,
    documentFile,
  ]);

  // Show loading state while form metadata is being fetched
  if (metadataLoading && !metadata) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader>Loading form...</Loader>
      </div>
    );
  }

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
          <button
            onClick={() => setIsDebugModalOpen(true)}
            className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            title="Inject debug schema"
          >
            📝 Inject Schema
          </button>
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
                  initialUrl={documentUrl}
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
                  onFileSelect={handlePdfFileSelect}
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
            formLabel={formLabel}
            metadata={metadata}
            documentUrl={documentUrl}
            onMetadataChange={(updatedMetadata: IFormMetadata) => {
              setMetadata(updatedMetadata);
            }}
          />
        )}
      </div>

      {/* Debug Schema Injector Modal */}
      {isDebugModalOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="max-h-[80vh] w-[600px] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold">Inject Debug Schema</h2>
            <textarea
              value={debugSchemaInput}
              onChange={(e) => setDebugSchemaInput(e.target.value)}
              placeholder="Paste your schema JSON here..."
              className="h-64 w-full rounded border border-slate-300 p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDebugModalOpen(false);
                  setDebugSchemaInput("");
                }}
                className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleInjectSchema}
                className="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
              >
                Inject Schema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function PdfJsEditorPageWrapper() {
  return (
    <Suspense fallback={<Loader>Loading editor…</Loader>}>
      <PdfJsEditorPage />
    </Suspense>
  );
}

export default PdfJsEditorPageWrapper;
