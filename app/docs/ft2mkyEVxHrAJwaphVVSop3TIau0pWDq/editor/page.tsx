/**
 * @ Author: BetterInternship
 * @ Description: Main form editor page with context-based state management
 */

"use client";

import { useEffect, useState } from "react";
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
import { FormEditorProvider } from "@/app/contexts/form-editor.context";
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

export default function FormEditorPage() {
  const searchParams = useSearchParams();
  const formId = searchParams.get("id") || searchParams.get("form_id");
  const [formMetadata, setFormMetadata] = useState<IFormMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { openModal } = useModal();

  // Fetch form metadata if ID is provided
  const { data: fetchedData } = useFormsControllerGetLatestFormDocumentAndMetadata(formId || "", {
    enabled: !!formId,
  });

  useEffect(() => {
    const initForm = async () => {
      try {
        setIsLoading(true);

        if (formId && fetchedData?.metadata) {
          setFormMetadata(fetchedData.metadata);
        } else {
          // Use blank form template
          setFormMetadata(BLANK_FORM_METADATA);
        }
      } catch (error) {
        console.error("Error loading form:", error);
        toast.error("Failed to load form", toastPresets.destructive);
        setFormMetadata(BLANK_FORM_METADATA);
      } finally {
        setIsLoading(false);
      }
    };

    initForm();
  }, [formId, fetchedData]);

  const handleSave = async (metadata: IFormMetadata) => {
    setIsSaving(true);
    try {
      await formsControllerRegisterForm({
        body: {
          metadata,
        },
      });
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
    <FormEditorProvider initialMetadata={formMetadata}>
      <div className="bg-background flex h-screen w-screen flex-col overflow-hidden">
        {/* Toolbar */}
        <EditorToolbar onSave={() => handleSave(formMetadata)} isSaving={isSaving} />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Tabs Sidebar */}
          <EditorTabs />

          {/* Tab Content */}
          <EditorContent />
        </div>
      </div>
    </FormEditorProvider>
  );
}
