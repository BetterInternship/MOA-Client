"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { FormInput, FormTextarea } from "@/components/docs/forms/EditForm";
import { PartiesPanel } from "@/components/docs/form-editor/form-layout/PartiesPanel";
import { IFormSigningParty, IFormMetadata } from "@betterinternship/core/forms";
import { formsControllerRegisterForm } from "@/app/api";

const CreateFormPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formName, setFormName] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [signingParties, setSigningParties] = useState<IFormSigningParty[]>([
    {
      _id: "initiator",
      order: 1,
      signatory_title: "initiator",
      signatory_source: "initiator",
    },
  ]);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setPdfFile(file);
    toast.success("PDF uploaded successfully");
  };

  const handleCreateForm = async () => {
    if (!pdfFile) {
      toast.error("Please upload a PDF file");
      return;
    }
    if (!formName.trim()) {
      toast.error("Please enter a form name");
      return;
    }
    if (!formLabel.trim()) {
      toast.error("Please enter a form label");
      return;
    }
    if (signingParties.length === 0) {
      toast.error("Please add at least one signing party");
      return;
    }

    setIsLoading(true);

    try {
      // Create the form metadata object
      const formMetadata: IFormMetadata = {
        name: formName,
        label: formLabel,
        schema_version: 1,
        schema: { blocks: [] },
        signing_parties: signingParties,
        subscribers: [],
      };

      // Use the pre-configured formsControllerRegisterForm function
      const response = await formsControllerRegisterForm({
        ...formMetadata,
        base_document: pdfFile,
      });

      toast.success("Form created successfully");

      // Wait a moment for the backend to process and then redirect to editor
      // This ensures the API can fetch the newly created form
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to editor with the form name
      router.push(`./editor?form_name=${encodeURIComponent(formName)}`);
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error(
        `Failed to create form: ${error instanceof Error ? error.message : String(error)}`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white">
      {/* Header - Sticky at top */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-semibold text-slate-900">Create New Form</h1>
        </div>
      </div>

      {/* Content - Scrolls with footer buttons at end */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-4">
          {/* PDF Upload Section */}
          <div className="space-y-1.5">
            <h2 className="text-xs font-semibold text-slate-900">PDF Document</h2>
            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
              <label className="flex cursor-pointer flex-col items-center gap-2">
                <Upload className="h-7 w-7 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-900">
                    {pdfFile ? "✓ PDF Uploaded" : "Click to upload PDF"}
                  </p>
                  {pdfFile ? (
                    <p className="mt-0.5 text-[11px] text-slate-600">{pdfFile.name}</p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Drag and drop or click to select
                    </p>
                  )}
                </div>
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Form Details Section */}
          <div className="space-y-1.5">
            <h2 className="text-xs font-semibold text-slate-900">Form Details</h2>
            <div className="space-y-3 rounded-lg bg-slate-50 p-3">
              <FormInput
                label="Form Name"
                placeholder="e.g., employee_onboarding"
                value={formName}
                setter={setFormName}
                required={true}
              />

              <FormTextarea
                label="Form Label"
                placeholder="e.g., Employee Onboarding Form"
                value={formLabel}
                setter={setFormLabel}
                required={true}
              />
            </div>
          </div>

          {/* Signing Parties Section */}
          <div className="space-y-1.5">
            <h2 className="text-xs font-semibold text-slate-900">Signing Parties</h2>
            <div className="rounded-lg bg-slate-50 p-3">
              <PartiesPanel parties={signingParties} onPartiesChange={setSigningParties} />
            </div>
          </div>

          {/* Footer Buttons - At end of scrollable content */}
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button variant="outline" onClick={() => router.back()} disabled={isLoading} size="sm">
              Cancel
            </Button>
            <Button onClick={handleCreateForm} disabled={isLoading} className="" size="sm">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  Create & Open in Editor
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFormPage;
