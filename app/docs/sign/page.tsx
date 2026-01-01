"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { DocumentRenderer } from "@/components/docs/forms/previewer";
import { useFormRendererContext } from "@/components/docs/forms/form-renderer.ctx";
import { Button } from "@/components/ui/button";
import { useFormProcess } from "@/components/docs/forms/form-process.ctx";
import { FormFillerRenderer } from "@/components/docs/forms/FormFillerRenderer";
import { Loader2 } from "lucide-react";
import { useFormFiller } from "@/components/docs/forms/form-filler.ctx";

const Page = () => {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
};

function PageContent() {
  const params = useSearchParams();
  const form = useFormRendererContext();
  const formProcess = useFormProcess();
  const formFiller = useFormFiller();
  const [mobileStage, setMobileStage] = useState("");

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
    if (formName && signingPartyId) {
      form.updateFormName(formName);
      form.updateSigningPartyId(signingPartyId);
      formFiller.updateSigningPartyId(signingPartyId);
    }
  }, [formProcess]);

  return (
    <div className="bg-opacity-25 relative mx-auto my-7 flex h-[100%] max-h-[100%] w-full max-w-7xl flex-col items-center overflow-y-hidden rounded-[0.33em] border border-gray-400 bg-white">
      <div className="relative flex h-[100%] w-full flex-col justify-center overflow-y-hidden sm:w-7xl sm:flex-row">
        {/* Form Renderer */}
        <div className="relative h-full max-h-full w-full overflow-hidden">
          <div className={cn("mb-2 sm:hidden", mobileStage === "preview" ? "" : "hidden")}>
            <div className="relative mx-auto w-full overflow-auto rounded-md border">
              {formProcess.latest_document_url ? (
                <DocumentRenderer
                  documentUrl={formProcess.latest_document_url}
                  highlights={[]}
                  previews={form.previews}
                  onHighlightFinished={() => {}}
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
                <DocumentRenderer
                  documentUrl={formProcess.latest_document_url}
                  highlights={[]}
                  previews={form.previews}
                  onHighlightFinished={() => {}}
                />
              ) : (
                <div className="p-4 text-sm text-gray-500">No preview available</div>
              )}
            </div>
          </div>

          {/* loading / error / empty / form */}
          {form.loading ? (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading form…
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
                  <DocumentRenderer
                    documentUrl={formProcess.latest_document_url}
                    highlights={[]}
                    previews={form.previews}
                    onHighlightFinished={() => {}}
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
