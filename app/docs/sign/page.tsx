"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FormFillerRenderer } from "@/components/docs/forms/FormFillerRenderer";
import { FormActionButtons } from "@/components/docs/forms/FormActionButtons";
import { useFormRendererContext } from "@/components/docs/forms/form-renderer.ctx";
import { useFormProcess } from "@/components/docs/forms/form-process.ctx";
import { useFormFiller } from "@/components/docs/forms/form-filler.ctx";
import { FormPreviewPdfDisplay } from "@/components/docs/forms/previewer";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useMyAutofill } from "@/hooks/use-my-autofill";
import { useSignContext } from "../auth/provider/sign.ctx";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, LucideClipboardCheck } from "lucide-react";
import { formsControllerMarkFormAsFirstViewed } from "@/app/api";
import { withDerivedFormValues } from "@/lib/derived-form-values";
import { cn } from "@/lib/utils";
import { DelegateEmailScreen } from "./components/DelegateEmailScreen";
import { SignIntentGate } from "./components/SignIntentGate";
import { useIsMobile } from "@/hooks/use-mobile";

type MobileSigningStep = "preview-start" | "fields" | "preview-review" | "confirm";

const Page = () => {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
};

function PageContent() {
  const [view, setView] = useState<"choice" | "form" | "delegate">("choice");
  const [mobileStep, setMobileStep] = useState<MobileSigningStep>("preview-start");
  const [hasConfirmedDetails, setHasConfirmedDetails] = useState(false);
  const [delegateEmail, setDelegateEmail] = useState("");
  const params = useSearchParams();
  const isMobile = useIsMobile();
  const profile = useSignatoryProfile();
  const form = useFormRendererContext();
  const formProcess = useFormProcess();
  const formFiller = useFormFiller();
  const autofillValues = useMyAutofill();
  const signContext = useSignContext();
  const finalValues = useMemo(
    () => formFiller.getFinalValues(autofillValues),
    [formFiller, form, autofillValues]
  );
  const previewValues = useMemo(
    () => withDerivedFormValues(form.formMetadata, finalValues),
    [form.formMetadata, finalValues]
  );
  const previewPrefillUser = useMemo(
    () => ({
      ...(profile as unknown as Record<string, unknown>),
      ...(autofillValues as unknown as Record<string, unknown>),
    }),
    [profile, autofillValues]
  );

  useEffect(() => {
    const formProcessId = (params.get("form-process-id") || "").trim();
    const supposedSigningPartyId = (params.get("signing-party-id") || "").trim();
    formProcess.setFormProcessId(formProcessId);
    formProcess.setSupposedSigningPartyId(supposedSigningPartyId);
  }, [params]);

  useEffect(() => {
    const formName = formProcess.form_name;
    const signingPartyId = formProcess.my_signing_party_id;

    if (formName && signingPartyId) {
      form.updateFormName(formName);
      form.updateSigningPartyId(signingPartyId);
    }
  }, [formProcess]);

  const markAsViewed = async (formProcessId: string) => {
    try {
      await formsControllerMarkFormAsFirstViewed({ formProcessId });
    } catch (error) {
      console.warn("Failed to mark form as first viewed:", error);
    }
  };

  useEffect(() => {
    if (formProcess.id && profile.id) void markAsViewed(formProcess.id);
  }, [formProcess.id, profile.id]);

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

    for (const signatureField of signatureFields) {
      const signatureValue = valuesWithPrefilledSignatures[signatureField.field];
      if (signatureValue?.trim()) {
        signContext.setHasAgreedForSignature(signatureField.field, signatureValue, true);
      }
    }
  }, [formProcess, form]);

  useEffect(() => {
    if (view !== "form") {
      setMobileStep("preview-start");
      setHasConfirmedDetails(false);
    }
  }, [view]);

  useEffect(() => {
    if (!isMobile) {
      setMobileStep("preview-start");
      setHasConfirmedDetails(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (mobileStep === "confirm") {
      setHasConfirmedDetails(false);
    }
  }, [mobileStep]);

  const previewBlocks = useMemo(() => {
    if (!form.formMetadata) return [];
    return form.formMetadata
      .getBlocksForEditorService()
      .filter((block) => block.field_schema || block.phantom_field_schema);
  }, [form.formMetadata]);

  const signingParties = useMemo(
    () => (form.formMetadata ? form.formMetadata.getSigningParties() : []),
    [form.formMetadata]
  );
  const mobileSteps: MobileSigningStep[] = ["preview-start", "fields", "preview-review", "confirm"];
  const mobileStepNumber = mobileSteps.indexOf(mobileStep) + 1;
  const mobileStepIndexByStep = useMemo(
    () => new Map(mobileSteps.map((step, index) => [step, index])),
    [mobileSteps]
  );
  const mobileStepTitles: Record<MobileSigningStep, string> = {
    "preview-start": "Preview the blank document",
    fields: "Fill required fields",
    "preview-review": "Review the completed PDF",
    confirm: "Confirm before submitting",
  };
  const getMobileStepHiddenClass = (step: MobileSigningStep) => {
    const currentIndex = mobileStepIndexByStep.get(mobileStep) ?? 0;
    const stepIndex = mobileStepIndexByStep.get(step) ?? 0;

    return stepIndex < currentIndex
      ? "-translate-x-6 opacity-0 pointer-events-none"
      : "translate-x-6 opacity-0 pointer-events-none";
  };

  const goToMobileStep = (nextStep: MobileSigningStep) => {
    setMobileStep(nextStep);
  };

  const handleMobileFieldsNext = () => {
    const errors = formFiller.validate(form.fields, autofillValues);
    if (Object.keys(errors).length) {
      toast.error("Some information is missing or incorrect");
      return;
    }

    goToMobileStep("preview-review");
  };

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

  const choiceExitTransition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1] as const,
  };
  const nextScreenEnterTransition = {
    duration: 0.35,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center overflow-y-scroll [scrollbar-gutter:stable]">
      <div className="w-full flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="truncate text-xl font-semibold whitespace-nowrap text-gray-900 sm:text-2xl">
              {form.formLabel}
            </h3>

            {view !== "choice" && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setView("choice")}
                className="px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mx-auto min-h-0 w-full flex-1 px-0 py-0 transition-[max-width] duration-500 ease-in-out sm:px-6 sm:py-4",
          "max-w-7xl"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {view === "choice" ? (
            <motion.div
              key="choice"
              className="h-full"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -32, transition: choiceExitTransition }}
            >
              <SignIntentGate
                onSignSelf={() => setView("form")}
                onDelegate={() => setView("delegate")}
              />
            </motion.div>
          ) : view === "delegate" ? (
            <motion.div
              key="delegate"
              className="h-full"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0, transition: nextScreenEnterTransition }}
              exit={{ opacity: 0, y: -16, transition: choiceExitTransition }}
            >
              <DelegateEmailScreen email={delegateEmail} onEmailChange={setDelegateEmail} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="h-full"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0, transition: nextScreenEnterTransition }}
              exit={{ opacity: 0, y: -16, transition: choiceExitTransition }}
            >
              <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[0.33em] border border-gray-300 bg-white">
                {isMobile && (
                  <div className="border-b border-gray-300 bg-gray-100 px-4 py-3">
                    <div className="text-xs font-medium text-gray-700">
                      Step {mobileStepNumber} of {mobileSteps.length}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {mobileStepTitles[mobileStep]}
                    </div>
                  </div>
                )}

                {isMobile ? (
                  <div className="relative min-h-0 flex-1 overflow-hidden">
                    <div
                      className={`absolute inset-0 flex min-h-0 flex-col bg-white transition-all duration-500 ease-in-out ${
                        mobileStep === "preview-start"
                          ? "pointer-events-auto translate-x-0 opacity-100"
                          : getMobileStepHiddenClass("preview-start")
                      }`}
                    >
                      <div className="min-h-0 flex-1">
                        {formProcess.latest_document_url ? (
                          <FormPreviewPdfDisplay
                            key="mobile-preview-start"
                            documentUrl={formProcess.latest_document_url}
                            blocks={previewBlocks}
                            values={{}}
                            fieldErrors={formFiller.errors}
                            onFieldClick={(fieldName) => {
                              form.setSelectedPreviewId(fieldName);
                              goToMobileStep("fields");
                            }}
                            selectedFieldId={form.selectedPreviewId}
                            scale={0.5}
                            signingParties={signingParties}
                            currentSigningPartyId={formProcess.my_signing_party_id}
                            showOwnership
                            defaultFieldVisibility="mine"
                            prefillMode="none"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-4 text-sm text-gray-500">
                            No preview available
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 border-t border-gray-200 bg-white p-3">
                        <Button
                          size="lg"
                          className="w-full whitespace-nowrap"
                          onClick={() => goToMobileStep("fields")}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    <div
                      className={`absolute inset-0 min-h-0 bg-white transition-all duration-500 ease-in-out ${
                        mobileStep === "fields"
                          ? "pointer-events-auto translate-x-0 opacity-100"
                          : getMobileStepHiddenClass("fields")
                      }`}
                    >
                      <div className="flex h-full min-h-0 flex-col">
                        <div className="min-h-0 flex-1">
                          <FormFillerRenderer />
                        </div>
                        <div className="shrink-0 border-t border-gray-300 bg-gray-50 p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-11 w-11 shrink-0"
                              onClick={() => goToMobileStep("preview-start")}
                              aria-label="Back to blank PDF preview"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              size="lg"
                              className="flex-1 whitespace-nowrap"
                              onClick={() => {
                                handleMobileFieldsNext();
                              }}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`absolute inset-0 flex min-h-0 flex-col bg-white transition-all duration-500 ease-in-out ${
                        mobileStep === "preview-review"
                          ? "pointer-events-auto translate-x-0 opacity-100"
                          : getMobileStepHiddenClass("preview-review")
                      }`}
                    >
                      <div className="min-h-0 flex-1">
                        {formProcess.latest_document_url ? (
                          <FormPreviewPdfDisplay
                            key="mobile-preview-review"
                            documentUrl={formProcess.latest_document_url}
                            blocks={previewBlocks}
                            values={previewValues}
                            fieldErrors={formFiller.errors}
                            onFieldClick={(fieldName) => {
                              form.setSelectedPreviewId(fieldName);
                              goToMobileStep("fields");
                            }}
                            selectedFieldId={form.selectedPreviewId}
                            scale={0.5}
                            signingParties={signingParties}
                            currentSigningPartyId={formProcess.my_signing_party_id}
                            showOwnership
                            defaultFieldVisibility="mine"
                            prefillMode="live"
                            prefillUser={previewPrefillUser}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-4 text-sm text-gray-500">
                            No preview available
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 border-t border-gray-200 bg-white p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-11 w-11 shrink-0"
                            onClick={() => goToMobileStep("fields")}
                            aria-label="Back to form fields"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            size="lg"
                            className="flex-1 whitespace-nowrap"
                            onClick={() => goToMobileStep("confirm")}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`absolute inset-0 min-h-0 bg-white transition-all duration-500 ease-in-out ${
                        mobileStep === "confirm"
                          ? "pointer-events-auto translate-x-0 opacity-100"
                          : getMobileStepHiddenClass("confirm")
                      }`}
                    >
                      <div className="flex h-full min-h-0 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                          <div className="flex flex-col items-start gap-4">
                            <LucideClipboardCheck className="-ml-2 h-16 min-h-16 w-16 opacity-30" />
                            <span className="font-semibold text-gray-700">
                              Please check if all your inputs are correct
                            </span>
                            <label className="flex cursor-pointer items-center gap-3 rounded-[0.33em] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                              <Checkbox
                                checked={hasConfirmedDetails}
                                className={cn(
                                  "h-5 w-5 rounded-[0.33em] border",
                                  hasConfirmedDetails
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-gray-300 bg-white"
                                )}
                                onCheckedChange={(checked) =>
                                  setHasConfirmedDetails(checked === true)
                                }
                              />
                              <span>I confirm all the details are correct</span>
                            </label>
                          </div>
                        </div>
                        <div className="shrink-0 border-t border-gray-300 bg-gray-50 p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-11 w-11 shrink-0"
                              onClick={() => goToMobileStep("preview-review")}
                              aria-label="Back to PDF review"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1">
                              <FormActionButtons submitDisabled={!hasConfirmedDetails} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="grid min-h-0 flex-1 grid-cols-1 transition-[grid-template-columns] duration-500 ease-in-out xl:[grid-template-columns:minmax(0,1fr)_var(--right-pane-width)]"
                    style={
                      {
                        "--right-pane-width": "600px",
                      } as React.CSSProperties
                    }
                  >
                    <div className="min-h-0 rounded-r-none bg-white transition-[transform] duration-500 ease-in-out xl:scale-100">
                      {formProcess.latest_document_url ? (
                        <FormPreviewPdfDisplay
                          documentUrl={formProcess.latest_document_url}
                          blocks={previewBlocks}
                          values={previewValues}
                          fieldErrors={formFiller.errors}
                          onFieldClick={(fieldName) => {
                            form.setSelectedPreviewId(fieldName);
                          }}
                          selectedFieldId={form.selectedPreviewId}
                          scale={0.7}
                          signingParties={signingParties}
                          currentSigningPartyId={formProcess.my_signing_party_id}
                          showOwnership
                          defaultFieldVisibility="mine"
                          prefillMode="live"
                          prefillUser={previewPrefillUser}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-4 text-sm text-gray-500">
                          No preview available
                        </div>
                      )}
                    </div>

                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white transition-[opacity,transform] duration-500 ease-in-out">
                      <div className="hidden h-[58px] items-center border-b border-gray-300 px-6 sm:flex">
                        <span className="text-sm font-medium text-gray-700">
                          Fill Required Fields
                        </span>
                      </div>

                      <div className="flex h-full min-h-0 flex-1 flex-col pt-4 sm:pt-8">
                        <div className="min-h-0 flex-1">
                          <FormFillerRenderer />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Page;
