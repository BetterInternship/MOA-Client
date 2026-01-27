"use client";

import { useEffect, useRef, useState } from "react";
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
    selectedParentGroup,
    handleBlockUpdate,
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
      {/* Left Panel - Responsive */}
      <div className="bg-card flex flex-shrink-0 basis-80 flex-col overflow-hidden border-r lg:basis-[400px] xl:basis-[500px]">
        <FieldsPanel
          blocks={formMetadata.schema.blocks}
          selectedPartyId={selectedPartyId}
          onPartyChange={setSelectedPartyId}
          signingParties={formMetadata.signing_parties || []}
        />
      </div>

      {/* Center - PDF Viewer */}
      <div className="min-w-0 flex-1 overflow-hidden border-r">
        <PdfViewer />
      </div>

      {/* Right Panel - Responsive */}
      <div className="bg-card hidden flex-shrink-0 basis-60 flex-col overflow-hidden border-l md:flex lg:basis-74 xl:basis-80">
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
