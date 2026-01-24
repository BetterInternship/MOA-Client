/**
 * @ Author: BetterInternship
 * @ Description: Main form editor page with context-based state management
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { useModal } from "@/app/providers/modal-provider";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";
import { useFormsControllerGetLatestFormDocumentAndMetadata } from "@/app/api";
import { type IFormMetadata } from "@betterinternship/core/forms";
import { FormEditorProvider, useFormEditor } from "@/app/contexts/form-editor.context";
import { EditorToolbar } from "@/components/editor/toolbar/EditorToolbar";
import { EditorTabs } from "@/components/editor/tabs/EditorTabs";
import { EditorContent } from "@/components/editor/tabs/EditorContent";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Blank form metadata for new forms
const BLANK_FORM_METADATA: IFormMetadata = {
  name: "new-form",
  label: "New Form",
  schema_version: 1,
  schema: {
    blocks: [],
  },
  signing_parties: [
    {
      _id: "initiator",
      order: 1,
      signatory_title: "initiator",
    },
  ],
  subscribers: [],
};

function FormEditorLoadingFallback() {
  return (
    <div className="bg-background flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader />
        <p className="text-muted-foreground text-sm">Loading editor...</p>
      </div>
    </div>
  );
}

function FormEditorContent() {
  const searchParams = useSearchParams();
  const formName = searchParams.get("form_name");
  const { setFormMetadata, setFormDocument, setFormVersion, setDocumentUrl } = useFormEditor();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorTabsVisible, setIsEditorTabsVisible] = useState(true);

  const { data: fetchedData } = useFormsControllerGetLatestFormDocumentAndMetadata({
    name: formName || "",
  });

  useEffect(() => {
    const initForm = () => {
      try {
        setIsLoading(true);

        if (formName && fetchedData?.formMetadata) {
          setFormMetadata(fetchedData.formMetadata);
          setFormDocument(fetchedData.formDocument || null);
          setFormVersion(fetchedData.formVersion || null);
          setDocumentUrl(fetchedData.documentUrl || null);
        } else {
          setFormMetadata(BLANK_FORM_METADATA);
          setFormDocument(null);
          setFormVersion(null);
          setDocumentUrl(null);
        }
      } catch (error) {
        console.error("Error loading form:", error);
        toast.error("Failed to load form", toastPresets.destructive);
        setFormMetadata(BLANK_FORM_METADATA);
        setFormDocument(null);
        setFormVersion(null);
        setDocumentUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    initForm();
  }, [formName, fetchedData]);

  if (isLoading) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader />
          <p className="text-muted-foreground text-sm">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <EditorToolbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {isEditorTabsVisible && <EditorTabs />}

        <EditorContent />
      </div>

      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-6 h-10 w-10 rounded-full shadow-lg"
        onClick={() => setIsEditorTabsVisible(!isEditorTabsVisible)}
        title={isEditorTabsVisible ? "Hide Editor Tabs" : "Show Editor Tabs"}
      >
        {isEditorTabsVisible ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export default function FormEditorPage() {
  return (
    <Suspense fallback={<FormEditorLoadingFallback />}>
      <FormEditorProvider>
        <FormEditorContent />
      </FormEditorProvider>
    </Suspense>
  );
}
