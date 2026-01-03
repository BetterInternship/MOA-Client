"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FormFillerRenderer } from "@/components/docs/forms/FormFillerRenderer";
import { useFormRendererContext } from "@/components/docs/forms/form-renderer.ctx";
import { Button } from "@/components/ui/button";
import { useFormProcess } from "@/components/docs/forms/form-process.ctx";
import { Loader2 } from "lucide-react";
import { useFormFiller } from "@/components/docs/forms/form-filler.ctx";
import { FormPreviewPdfDisplay } from "@/components/docs/forms/previewer";
import { getBlockField, isBlockField } from "@/components/docs/forms/utils";
import { Loader } from "@/components/ui/loader";
import { useMyAutofill } from "@/hooks/use-my-autofill";
import { useSignContext } from "../auth/provider/sign.ctx";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { Badge } from "@/components/ui/badge";

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
  const [mobileStage, setMobileStage] = useState<"preview" | "form" | "confirm">("preview");
  const finalValues = useMemo(
    () => formFiller.getFinalValues(autofillValues),
    [formFiller, autofillValues]
  );

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
      finalValues,
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

  console.log("errrr", formProcess.error);
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
    <div className="bg-opacity-25 relative mx-auto flex h-[87dvh] w-full max-w-7xl flex-col items-center overflow-hidden rounded-[0.33em] bg-white">
      <div className="relative flex h-full w-full flex-col justify-center overflow-hidden pt-4 sm:w-7xl sm:flex-row">
        {/* Form Renderer */}
        <div className="relative h-full max-h-full w-full overflow-hidden">
          {/* MOBILE */}
          <div className={cn("mb-2 sm:hidden", mobileStage === "preview" ? "" : "hidden")}>
            <div className="relative mx-auto w-full overflow-auto rounded-md border">
              {formProcess.latest_document_url ? (
                <FormPreviewPdfDisplay
                  documentUrl={formProcess.latest_document_url}
                  blocks={manualKeyedFields}
                  values={finalValues}
                  onFieldClick={(fieldName) => form.setSelectedPreviewId(fieldName)}
                  selectedFieldId={form.selectedPreviewId}
                />
              ) : (
                <div className="p-4 text-sm text-gray-500">No preview available</div>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <Button
                className="w-full"
                onClick={() => setMobileStage("form")}
                disabled={form.loading}
              >
                Fill Form
              </Button>
            </div>
          </div>

          {/* Mobile: confirm preview stage */}
          <div className={cn("sm:hidden", mobileStage === "confirm" ? "" : "hidden")}>
            <div className="relative h-[60vh] w-full overflow-auto rounded-md border bg-white">
              {formProcess.latest_document_url ? (
                <FormPreviewPdfDisplay
                  documentUrl={formProcess.latest_document_url}
                  blocks={manualKeyedFields}
                  values={finalValues}
                  onFieldClick={(fieldName) => form.setSelectedPreviewId(fieldName)}
                  selectedFieldId={form.selectedPreviewId}
                />
              ) : (
                <div className="p-4 text-sm text-gray-500">No preview available</div>
              )}
            </div>
          </div>

          {/* DESKTOP */}
          {/* loading / error / empty / form */}
          {form.loading ? (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading form...
              </span>
            </div>
          ) : (
            <FormFillerRenderer />
          )}
        </div>

        {/* PDF Renderer - hidden on small screens, visible on sm+ */}
        <div className="relative hidden max-w-[600px] min-w-[600px] overflow-auto sm:block">
          {!form.loading ? (
            <div className="relative flex h-full w-full flex-row gap-2">
              {!!formProcess.latest_document_url && (
                <div className="relative h-full w-full">
                  <FormPreviewPdfDisplay
                    documentUrl={formProcess.latest_document_url}
                    blocks={manualKeyedFields}
                    values={finalValues}
                    onFieldClick={(fieldName) => form.setSelectedPreviewId(fieldName)}
                    selectedFieldId={form.selectedPreviewId}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Page;
