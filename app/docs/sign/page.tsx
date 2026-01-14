"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FormFillerRenderer } from "@/components/docs/forms/FormFillerRenderer";
import { useFormRendererContext } from "@/components/docs/forms/form-renderer.ctx";
import { Button } from "@/components/ui/button";
import { useFormProcess } from "@/components/docs/forms/form-process.ctx";
import { Loader2, ChevronLeft } from "lucide-react";
import { useFormFiller } from "@/components/docs/forms/form-filler.ctx";
import { FormPreviewPdfDisplay } from "@/components/docs/forms/previewer";
import { getBlockField, isBlockField } from "@/components/docs/forms/utils";
import { Loader } from "@/components/ui/loader";
import { useMyAutofill } from "@/hooks/use-my-autofill";
import { useSignContext } from "../auth/provider/sign.ctx";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { Badge } from "@/components/ui/badge";
import { FormActionButtons } from "@/components/docs/forms/FormActionButtons";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";

const Page = () => {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
};

function PageContent() {
  const params = useSearchParams();
  const profile = useSignatoryProfile();
  const form = useFormRendererContext();
  const formProcess = useFormProcess();
  const formFiller = useFormFiller();
  const autofillValues = useMyAutofill();
  const signContext = useSignContext();
  const [mobileStage, setMobileStage] = useState<"preview" | "form" | "sign">("preview");
  const finalValues = useMemo(
    () => formFiller.getFinalValues(autofillValues),
    [formFiller, form, autofillValues]
  );

  // Show mobile notice toast on mount
  useEffect(() => {
    const isMobile = window.innerWidth < 640; // sm breakpoint
    if (isMobile) {
      toast(
        "Our desktop experience might currently be preferable, so let us know if you have insights about how we can make mobile better! Chat us on Facebook or email us at hello@betterinternship.com if you go through any issues.",
        {
          duration: 6000,
          className: "text-justify",
        }
      );
    }
  }, []);

  // Update the form process stuff
  useEffect(() => {
    const formProcessId = (params.get("form-process-id") || "").trim();
    const supposedSigningPartyId = (params.get("signing-party-id") || "").trim();
    formProcess.setFormProcessId(formProcessId);
    formProcess.setSupposedSigningPartyId(supposedSigningPartyId);
  }, [params]);

  // Update form data after loading form process
  useEffect(() => {
    const formName = formProcess.form_name;
    const signingPartyId = formProcess.my_signing_party_id;

    // If somehting needs to change
    if (formName && signingPartyId) {
      form.updateFormName(formName);
      form.updateSigningPartyId(signingPartyId);
    }
  }, [formProcess]);

  // Update sign context
  useEffect(() => {
    if (!formProcess.my_signing_party_id || !form.formName) return;

    const signatureFields = form.formMetadata.getSignatureFieldsForClientService(
      formProcess.my_signing_party_id
    );
    const valuesWithPrefilledSignatures = form.formMetadata.setSignatureValueForSigningParty(
      formFiller.getFinalValues(autofillValues),
      profile.name,
      formProcess.my_signing_party_id
    );

    formFiller.setValues(valuesWithPrefilledSignatures);
    signContext.setRequiredSignatures(
      signatureFields.map((signatureField) => signatureField.field)
    );
  }, [formProcess, form]);

  // Filter blocks to only include manual source fields
  const manualBlocks = useMemo(
    () =>
      form.blocks.filter(
        (block) => isBlockField(block) && getBlockField(block)?.source === "manual"
      ),
    [form.blocks]
  );

  // Get keyedFields that correspond to manual blocks (for PDF preview with coordinates)
  const manualKeyedFields = useMemo(() => {
    if (!form.keyedFields || form.keyedFields.length === 0) return [];

    // Get field names from manual blocks
    const manualFieldNames = new Set(
      manualBlocks.map((block) => getBlockField(block)?.field).filter(Boolean)
    );

    // Filter keyedFields to only those in manual blocks
    return form.keyedFields.filter((kf) => manualFieldNames.has(kf.field));
  }, [form.keyedFields, manualBlocks]);

  if (formProcess.error) {
    return (
      <div className="bg-opacity-25 relative mx-auto flex h-[87dvh] w-full max-w-7xl flex-col items-center overflow-hidden rounded-[0.33em] bg-white">
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden pt-4 sm:w-7xl sm:flex-row">
          <div className="flex flex-col gap-4 rounded-[0.33em] border border-gray-300 p-3 px-4">
            <Badge className="text-md w-fit" type="destructive">
              Notice
            </Badge>
            <span className="text-gray-700">
              This form is unavailable. <br /> Reason:{" "}
              {formProcess.error.toString().replace("Error: ", "")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!form.formMetadata || form.loading) return <Loader>Loading form...</Loader>;

  return (
    <div className="bg-opacity-25 relative mx-auto flex h-full w-full max-w-7xl flex-col items-center overflow-hidden rounded-[0.33em] border border-gray-200 bg-white">
      {/* ============ MOBILE LAYOUT ============ */}
      <div className="flex h-full w-full flex-col overflow-hidden sm:hidden">
        {/* Mobile: Preview Stage - Show PDF */}
        {mobileStage === "preview" && (
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {formProcess.latest_document_url ? (
                <FormPreviewPdfDisplay
                  documentUrl={formProcess.latest_document_url}
                  blocks={manualKeyedFields}
                  values={finalValues}
                  onFieldClick={(fieldName) => form.setSelectedPreviewId(fieldName)}
                  selectedFieldId={form.selectedPreviewId}
                  scale={0.7}
                />
              ) : (
                <div className="p-4 text-sm text-gray-500">No preview available</div>
              )}
            </div>

            <div className="border-t bg-white p-4">
              <Button
                className="h-10 w-full"
                onClick={() => setMobileStage("form")}
                disabled={form.loading}
              >
                Start Filling
              </Button>
            </div>
          </div>
        )}

        {/* Mobile: Form Stage - Show Form Only */}
        {mobileStage === "form" && (
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {form.loading ? (
                <div className="flex h-full items-center justify-center">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading form…
                  </span>
                </div>
              ) : (
                <FormFillerRenderer />
              )}
            </div>

            <div className="flex gap-2 border-t bg-white p-4">
              <Button
                variant="ghost"
                className="h-10 flex-1"
                onClick={() => setMobileStage("preview")}
              >
                Back
              </Button>
              <Button
                className="h-10 flex-1"
                onClick={() => {
                  // Validate fields before proceeding
                  const errors = formFiller.validate(form.fields, autofillValues);
                  if (Object.keys(errors).length > 0) {
                    toast.error("There are missing fields", toastPresets.destructive);
                    return;
                  }
                  setMobileStage("sign");
                }}
              >
                Review
              </Button>
            </div>
          </div>
        )}

        {/* Mobile: Sign Stage - Show PDF with Signing Options */}
        {mobileStage === "sign" && (
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {formProcess.latest_document_url ? (
                <FormPreviewPdfDisplay
                  documentUrl={formProcess.latest_document_url}
                  blocks={manualKeyedFields}
                  values={finalValues}
                  onFieldClick={(fieldName) => form.setSelectedPreviewId(fieldName)}
                  selectedFieldId={form.selectedPreviewId}
                  scale={0.7}
                />
              ) : (
                <div className="p-4 text-sm text-gray-500">No preview available</div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t bg-white p-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                onClick={() => setMobileStage("form")}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <FormActionButtons />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="relative hidden h-full w-full flex-row gap-0 overflow-hidden sm:flex">
        {/* Desktop: Form on Left */}
        <div className="relative flex-1 overflow-auto">
          {form.loading ? (
            <div className="flex h-full items-center justify-center">
              <span className="inline-flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading form…
              </span>
            </div>
          ) : (
            <FormFillerRenderer />
          )}
        </div>

        {/* Desktop: PDF Preview on Right */}
        <div className="relative max-w-[600px] min-w-[600px] overflow-auto border-l">
          {!form.loading && formProcess.latest_document_url ? (
            <div className="relative h-full w-full">
              <FormPreviewPdfDisplay
                documentUrl={formProcess.latest_document_url}
                blocks={manualKeyedFields}
                values={finalValues}
                onFieldClick={(fieldName) => form.setSelectedPreviewId(fieldName)}
                selectedFieldId={form.selectedPreviewId}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Page;
