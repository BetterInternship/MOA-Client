"use client";

import { Button } from "@/components/ui/button";
import { useFormRendererContext } from "./form-renderer.ctx";
import { useState } from "react";
import { useFormFiller } from "./form-filler.ctx";
import { useMyAutofillUpdate, useMyAutofill } from "@/hooks/use-my-autofill";
import { TextLoader } from "@/components/ui/loader";
import { FormValues } from "@betterinternship/core/forms";
import { useQueryClient } from "@tanstack/react-query";
import { getClientAudit } from "@/lib/audit";
import { useSignatoryProfile } from "@/app/docs/auth/provider/signatory.ctx";
import { formsControllerContinueFormProcess } from "@/app/api";
import useModalRegistry from "@/components/modal-registry";
import { useFormProcess } from "./form-process.ctx";
import { useSignContext } from "@/app/docs/auth/provider/sign.ctx";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";
import {
  ISignatoryFormSettings,
  useFormSettings,
} from "@/app/docs/auth/provider/form-settings.ctx";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";

export function FormActionButtons() {
  const form = useFormRendererContext();
  const formFiller = useFormFiller();
  const formProcess = useFormProcess();
  const formSettings = useFormSettings();
  const autofillValues = useMyAutofill();
  const signContext = useSignContext();
  const profile = useSignatoryProfile();
  const modalRegistry = useModalRegistry();
  const updateAutofill = useMyAutofillUpdate();
  const queryClient = useQueryClient();
  const { update } = useSignatoryAccountActions();
  const [busy, setBusy] = useState<boolean>(false);

  // Signing blocks
  const signingPartyBlocks = form.formMetadata.getSigningPartyBlocks(
    formProcess.my_signing_party_id ?? ""
  );

  // Signatures
  const needsToSign =
    formProcess.my_signing_party_id &&
    form.formMetadata.getSignatureFieldsForClientService(formProcess.my_signing_party_id).length;

  /**
   * This submits the form to the server
   * @param withEsign - if true, enables e-sign; if false, does prefill
   * @param _bypassConfirm - internal flag to skip recipient confirmation on re-call
   * @returns
   */
  const handleSubmit = () => {
    setBusy(true);
    if (!profile.id) return;

    // Validate fields before allowing to proceed
    const signature = form.formMetadata.getSignatureValueForSigningParty(
      formFiller.getFinalValues({}),
      formProcess.my_signing_party_id!
    );
    const errors = formFiller.validate(form.fields, autofillValues);
    if (Object.keys(errors).length) {
      toast.error("There are missing fields", toastPresets.destructive);
      setBusy(false);
      return;
    }

    // Proceed to save and submit
    try {
      setBusy(true);

      // Open request for contacts
      if (signingPartyBlocks.length) {
        modalRegistry.specifySigningPartiesAndFormSettingsSetup.open(
          form.fields,
          formFiller,
          signingPartyBlocks,
          (finalValues: FormValues, settings: ISignatoryFormSettings) =>
            formsControllerContinueFormProcess({
              formProcessId: formProcess.id,
              supposedSigningPartyId: formProcess.my_signing_party_id!,
              values: finalValues,
              audit: getClientAudit(),
            }).then(async () => {
              await queryClient.invalidateQueries({ queryKey: ["my-forms"] });
              await formSettings.updateFormSettings(formProcess.form_name!, settings);
              if (settings.autosign && signature) await update.mutateAsync({ name: signature });
              modalRegistry.specifySigningPartiesAndFormSettingsSetup.close();
              modalRegistry.formContinuationSuccess.open();
            }),
          (finalValues: FormValues) => updateAutofill(form.formName, form.fields, finalValues),
          autofillValues
        );

        // Just e-sign and fill-out right away
      } else {
        modalRegistry.formSettingsSetup.open(
          form.fields,
          formFiller,
          (finalValues: FormValues, settings: ISignatoryFormSettings) =>
            formsControllerContinueFormProcess({
              formProcessId: formProcess.id,
              supposedSigningPartyId: formProcess.my_signing_party_id!,
              values: finalValues,
              audit: getClientAudit(),
            }).then(async () => {
              await queryClient.invalidateQueries({ queryKey: ["my-forms"] });
              await formSettings.updateFormSettings(formProcess.form_name!, settings);
              if (settings.autosign && signature) await update.mutateAsync({ name: signature });
              modalRegistry.specifySigningPartiesAndFormSettingsSetup.close();
              modalRegistry.formContinuationSuccess.open();
            }),
          (finalValues: FormValues) => updateAutofill(form.formName, form.fields, finalValues),
          autofillValues
        );
      }

      setBusy(false);
    } catch (e) {
      console.error("Submission error", e);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = () => {
    modalRegistry.formRejectionPrompt.open(formProcess.id);
  };

  return (
    <div className="flex items-start justify-end gap-2 pt-2">
      {!!needsToSign && (
        <Button
          onClick={() => void handleReject()}
          variant="outline"
          scheme="destructive"
          className="w-full text-xs sm:w-auto"
          disabled={busy}
        >
          <TextLoader loading={busy}>
            <span className="sm:hidden">Reject</span>
            <span className="hidden sm:inline">Reject Form</span>
          </TextLoader>
        </Button>
      )}
      <Button
        onClick={() => void handleSubmit()}
        variant="default"
        className="w-full text-xs sm:w-auto"
        disabled={busy || !signContext.hasAgreed}
      >
        <TextLoader loading={busy}>
          <span className="sm:hidden">Submit</span>
          <span className="hidden sm:inline">Submit Form</span>
        </TextLoader>
      </Button>
    </div>
  );
}
