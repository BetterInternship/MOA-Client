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
import {
  useFormsControllerGetLatestFormDocumentAndMetadata,
  formsControllerRegisterForm,
} from "@/app/api";
import { type IFormMetadata } from "@betterinternship/core/forms";
import { FormEditorProvider, useFormEditor } from "@/app/contexts/form-editor.context";
import { EditorToolbar } from "@/components/editor/toolbar/EditorToolbar";
import { EditorTabs } from "@/components/editor/tabs/EditorTabs";
import { EditorContent } from "@/components/editor/tabs/EditorContent";

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
  const { setFormMetadata, setFormDocument, setFormVersion, setDocumentUrl, formMetadata } =
    useFormEditor();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async (metadata: IFormMetadata) => {
    setIsSaving(true);
    try {
      await formsControllerRegisterForm(metadata);
      toast.success("Form saved successfully!", toastPresets.success);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save form", toastPresets.destructive);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

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

  if (!formMetadata) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold">Failed to load form</h2>
          <p className="text-muted-foreground text-sm">Please try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-screen w-screen flex-col overflow-hidden">
      <EditorToolbar onSave={() => handleSave(formMetadata)} isSaving={isSaving} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <EditorTabs />

        <EditorContent />
      </div>
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
