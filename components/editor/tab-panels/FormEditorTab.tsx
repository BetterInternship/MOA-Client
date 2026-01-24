"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";
import { FormEditorTabProvider, useFormEditorTab } from "@/app/contexts/form-editor-tab.context";
import { PdfViewerProvider } from "@/app/contexts/pdf-viewer.context";
import { PdfViewer } from "@/components/docs/form-editor/form-pdf-editor/PdfViewer";
import { FieldsPanel } from "./editor-components/FieldsPanel";
import { RevampedBlockEditor } from "./editor-components/RevampedBlockEditor";

function FormEditorTabContent() {
  const { formMetadata } = useFormEditor();
  const {
    selectedPartyId,
    setSelectedPartyId,
    selectedBlockId,
    selectedFieldId,
    selectedParentGroup,
    fields,
    handleBlockSelect,
    handleParentGroupSelect,
    handleBlockUpdate,
    handleFieldSelectFromPdf,
    handleFieldChange,
    handleFieldCreate,
    handleParentUpdate,
  } = useFormEditorTab();

  if (!formMetadata) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        No form loaded
      </div>
    );
  }

  const selectedBlock = selectedBlockId
    ? formMetadata.schema.blocks.find((b) => b._id === selectedBlockId)
    : null;

  return (
    <div className="bg-background flex h-full w-full">
      <div className="bg-card flex w-[350px] flex-col overflow-hidden border-r">
        <FieldsPanel
          blocks={formMetadata.schema.blocks}
          selectedPartyId={selectedPartyId}
          onPartyChange={setSelectedPartyId}
          onBlockSelect={handleBlockSelect}
          selectedBlockId={selectedBlockId}
          signingParties={formMetadata.signing_parties || []}
          onAddField={handleFieldCreate}
          onParentGroupSelect={handleParentGroupSelect}
        />
      </div>

      <div className="flex-1 overflow-hidden border-r">
        <PdfViewer
          fields={fields}
          selectedFieldId={selectedFieldId || ""}
          onFieldSelect={handleFieldSelectFromPdf}
          onFieldChange={handleFieldChange}
          onFieldCreate={(field) => {
            handleFieldCreate(field);
          }}
          signingParties={formMetadata.signing_parties || []}
        />
      </div>

      <div className="bg-card flex w-96 flex-col overflow-hidden">
        <RevampedBlockEditor
          block={selectedBlock || null}
          onUpdate={handleBlockUpdate}
          parentGroup={selectedParentGroup}
          onParentUpdate={handleParentUpdate}
        />
      </div>
    </div>
  );
}

export function FormEditorTab() {
  const { documentFile, setDocumentFile, lastLoadedFileName, setLastLoadedFileName } =
    useFormEditor();

  return (
    <PdfViewerProvider
      documentFile={documentFile}
      setDocumentFile={setDocumentFile}
      lastLoadedFileName={lastLoadedFileName}
      setLastLoadedFileName={setLastLoadedFileName}
    >
      <FormEditorTabProvider>
        <FormEditorTabContent />
      </FormEditorTabProvider>
    </PdfViewerProvider>
  );
}
