"use client";

import { useState } from "react";
import { FormValues } from "@betterinternship/core/forms";
import { Button } from "@/components/ui/button";
import { TextLoader } from "@/components/ui/loader";
import { getClientAudit } from "@/lib/audit";
import { formsControllerContinueFormProcess } from "@/app/api";
import { useSignatoryProfile } from "@/app/docs/auth/provider/signatory.ctx";
import { useSignContext } from "@/app/docs/auth/provider/sign.ctx";
import useModalRegistry from "@/components/modal-registry";
import { useMyAutofill, useMyAutofillUpdate } from "@/hooks/use-my-autofill";
import { useFormRendererContext } from "./form-renderer.ctx";
import { useFormFiller } from "./form-filler.ctx";
import { useFormProcess } from "./form-process.ctx";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";
import { withSubmittedSignatureImages } from "@/lib/signature-image-submit";
import { useTrackSignJob } from "./signJobs.ctx";

interface SubmitFormButtonProps {
  submitDisabled?: boolean;
  requireSignAgreement?: boolean;
}

function useFormActionController() {
  const form = useFormRendererContext();
  const formFiller = useFormFiller();
  const formProcess = useFormProcess();
  const autofillValues = useMyAutofill();
  const signContext = useSignContext();
  const profile = useSignatoryProfile();
  const modalRegistry = useModalRegistry();
  const updateAutofill = useMyAutofillUpdate();
  const trackSignJob = useTrackSignJob();
  const [busy, setBusy] = useState(false);

  const signingPartyBlocks = form.formMetadata.getSigningPartyBlocks(
    formProcess.my_signing_party_id ?? ""
  );

  const handleSubmit = async () => {
    setBusy(true);
    if (!profile.id) return;

    const finalValues = formFiller.getFinalValues(autofillValues);

    const errors = formFiller.validate(form.fields, autofillValues);
    if (Object.keys(errors).length) {
      toast.error("Some information is missing or incorrect", toastPresets.destructive);
      setBusy(false);
      return;
    }

    try {
      const finalValuesWithSignatures = await withSubmittedSignatureImages(finalValues);

      await updateAutofill(form.formName, form.fields, finalValuesWithSignatures);

      if (signingPartyBlocks.length) {
        modalRegistry.specifySigningParties.open(
          form.fields,
          formFiller,
          signingPartyBlocks,
          async (signingPartyValues: FormValues) => {
            const valuesWithSignatures = await withSubmittedSignatureImages({
              ...finalValuesWithSignatures,
              ...signingPartyValues,
            });
            const response = await formsControllerContinueFormProcess({
              formProcessId: formProcess.id,
              supposedSigningPartyId: formProcess.my_signing_party_id!,
              values: valuesWithSignatures,
              audit: getClientAudit(),
            });
            // 202 { jobId } now — signing runs async, so track the job and
            // return early rather than await its completion (plan S9).
            trackSignJob(
              response.jobId,
              formProcess.id,
              formProcess.my_signing_party_id!,
              form.formName
            );
            modalRegistry.specifySigningParties.close();
            modalRegistry.formContinuationSuccess.open();
          },
          updateAutofill,
          {},
          autofillValues,
          form.formMetadata.getSigningParties()
        );
      } else {
        const response = await formsControllerContinueFormProcess({
          formProcessId: formProcess.id,
          supposedSigningPartyId: formProcess.my_signing_party_id!,
          values: finalValuesWithSignatures,
          audit: getClientAudit(),
        });
        trackSignJob(
          response.jobId,
          formProcess.id,
          formProcess.my_signing_party_id!,
          form.formName
        );
        modalRegistry.formContinuationSuccess.open();
      }
    } catch (error) {
      console.error("Submission error", error);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = () => {
    modalRegistry.formRejectionPrompt.open(formProcess.id);
  };

  return {
    busy,
    canSubmit: signContext.hasAgreed,
    handleReject,
    handleSubmit,
  };
}

export function RejectFormButton() {
  const { busy, handleReject } = useFormActionController();

  return (
    <Button
      onClick={() => void handleReject()}
      size="lg"
      variant="outline"
      scheme="destructive"
      className="flex-1 whitespace-nowrap sm:w-auto"
      disabled={busy}
    >
      <TextLoader loading={busy}>
        <span className="sm:hidden">Reject</span>
        <span className="hidden sm:inline">Reject Form</span>
      </TextLoader>
    </Button>
  );
}

export function SubmitFormButton({
  submitDisabled = false,
  requireSignAgreement = true,
}: SubmitFormButtonProps) {
  const { busy, canSubmit, handleSubmit } = useFormActionController();

  return (
    <Button
      onClick={() => void handleSubmit()}
      size="lg"
      variant="default"
      className="flex-1 whitespace-nowrap sm:w-auto"
      disabled={busy || (requireSignAgreement && !canSubmit) || submitDisabled}
    >
      <TextLoader loading={busy}>
        <span className="sm:hidden">Submit</span>
        <span className="hidden sm:inline">Submit Form</span>
      </TextLoader>
    </Button>
  );
}

export function FormActionButtons({ submitDisabled = false }: SubmitFormButtonProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <RejectFormButton />
      <SubmitFormButton submitDisabled={submitDisabled} />
    </div>
  );
}
