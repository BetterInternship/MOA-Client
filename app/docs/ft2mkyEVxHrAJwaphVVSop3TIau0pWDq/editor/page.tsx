/**
 * @ Author: BetterInternship
 * @ Description: Main form editor page with context-based state management
 */

"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";
import { useFormsControllerGetLatestFormDocumentAndMetadata } from "@/app/api";
import {
  SCHEMA_VERSION,
  type IFormMetadata,
  BLANK_FORM_METADATA,
} from "@betterinternship/core/forms";
import { FormEditorProvider, useFormEditor } from "@/app/contexts/form-editor.context";
import { EditorToolbar } from "@/components/editor/toolbar/EditorToolbar";
import { EditorContent } from "@/components/editor/tabs/EditorContent";

function FormEditorLoadingFallback() {
  return (
    <div className="bg-background flex h-full min-h-0 w-full items-center justify-center">
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
  const {
    setFormMetadata,
    setFormDocument,
    setFormVersion,
    setDocumentUrl,
    setDocumentFile,
    setLastLoadedFileName,
  } = useFormEditor();
  const [isLoading, setIsLoading] = useState(true);
  const hasBootstrappedRef = useRef(false);
  const activeFormNameRef = useRef<string | null>(null);

  const { data: fetchedData } = useFormsControllerGetLatestFormDocumentAndMetadata({
    name: formName || "",
  });

  // Bootstraps editor state from API response and optionally downloads the latest PDF blob.
  // This keeps the PDF viewer, metadata panel, and save flow working from the same context state.
  useEffect(() => {
    const formChanged = activeFormNameRef.current !== formName;
    if (formChanged) {
      activeFormNameRef.current = formName;
      hasBootstrappedRef.current = false;
      setIsLoading(true);
    }

    // For existing forms, wait for first payload before leaving loading state.
    if (formName && !fetchedData?.formMetadata) return;

    const initForm = () => {
      try {
        const isInitialBootstrap = !hasBootstrappedRef.current;
        if (isInitialBootstrap) setIsLoading(true);
        const response = fetchedData as
          | (typeof fetchedData & {
              documentUrl?: string;
              formUrl?: string;
              formTemplate?: unknown;
              formDocument?: unknown;
            })
          | undefined;
        const resolvedDocumentUrl = response?.documentUrl ?? response?.formUrl ?? null;
        const resolvedFormDocument = response?.formTemplate ?? response?.formDocument ?? null;

        if (formName && fetchedData?.formMetadata) {
          setFormMetadata(fetchedData.formMetadata);
          setFormDocument((resolvedFormDocument as any) || null);
          setFormVersion(fetchedData.formVersion || null);
          setDocumentUrl(resolvedDocumentUrl);

          // Fetch remote PDF and hydrate `documentFile` only for initial bootstrap.
          // On save/refetch we keep current in-memory file to avoid fullscreen loading flicker.
          if (isInitialBootstrap && resolvedDocumentUrl) {
            fetch(resolvedDocumentUrl)
              .then((res) => {
                if (!res.ok) {
                  throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);
                }
                return res.blob();
              })
              .then((blob) => {
                const fileName = `${formName}.pdf`;
                const file = new File([blob], fileName, { type: "application/pdf" });
                setDocumentFile(file);
                setLastLoadedFileName(fileName);
                // Editor is ready only after both metadata and PDF are in context.
                setIsLoading(false);
                hasBootstrappedRef.current = true;
              })
              .catch((err) => {
                console.error("Failed to fetch PDF:", err);
                setIsLoading(false);
                hasBootstrappedRef.current = true;
              });
          } else {
            // Metadata-only form (no base document yet).
            if (isInitialBootstrap) {
              setIsLoading(false);
              hasBootstrappedRef.current = true;
            }
          }
        } else {
          // Create-new form path: seed blank metadata.
          setFormMetadata(BLANK_FORM_METADATA);
          setFormDocument(null);
          setFormVersion(null);
          setDocumentUrl(null);
          if (isInitialBootstrap) {
            setIsLoading(false);
            hasBootstrappedRef.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading form:", error);
        toast.error("Failed to load form", toastPresets.destructive);
        setFormMetadata(BLANK_FORM_METADATA);
        setFormDocument(null);
        setFormVersion(null);
        setDocumentUrl(null);
        setIsLoading(false);
        hasBootstrappedRef.current = true;
      }
    };

    initForm();
  }, [formName, fetchedData]);

  if (isLoading) {
    return (
      <div className="bg-background flex h-full min-h-0 w-full items-center justify-center">
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
