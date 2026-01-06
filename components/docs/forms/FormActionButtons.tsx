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

export function FormActionButtons() {
  const form = useFormRendererContext();
  const formFiller = useFormFiller();
  const formProcess = useFormProcess();
  const autofillValues = useMyAutofill();
  const signContext = useSignContext();
  const profile = useSignatoryProfile();
  const modalRegistry = useModalRegistry();
  const updateAutofill = useMyAutofillUpdate();
  const queryClient = useQueryClient();
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
  const handleSubmit = async () => {
    setBusy(true);
    if (!profile.id) return;

    // Validate fields before allowing to proceed
    const finalValues = formFiller.getFinalValues(autofillValues);
    const errors = formFiller.validate(form.fields, autofillValues);
    if (Object.keys(errors).length) return setBusy(false);

    // proceed to save + submit
    try {
      setBusy(true);

      // Update autofill afterwards (so even if it fails, autofill is there)
      await updateAutofill(form.formName, form.fields, finalValues);
      const signatureFullName = Object.values(
        form.formMetadata.getSignatureValueForSigningParty(
          finalValues,
          formProcess.my_signing_party_id!
        )
      )[0];

      // ! EEE THIS TOO GHETTO, FIX IN THE FUTURE
      // ! EEE THIS TOO GHETTO, FIX IN THE FUTURE
      // ! EEE THIS TOO GHETTO, FIX IN THE FUTURE
      // ! EEE THIS TOO GHETTO, FIX IN THE FUTURE
      // ! EEE THIS TOO GHETTO, FIX IN THE FUTURE
      // ! Consider maybe handling titles the same way as signature fields (maybe autogenerate? or maybe create a new class of fields that are autogen?? idk mehn)
      const signatureTitle =
        Object.entries(finalValues)
          .filter(([field, _value]) => field.includes("title:default"))
          .map(([_field, value]) => value)[0] ?? "";
      // ! EEE THIS TOO GHETTO, FIX IN THE FUTURE ^^^^^7^^
      // ! EEE THIS TOO GHETTO, FIX IN THE FUTURE ^^6^^^^^

      // Open request for contacts
      if (signingPartyBlocks.length) {
        modalRegistry.specifySigningParties.open(
          form.fields,
          formFiller,
          signingPartyBlocks,
          (signingPartyValues: FormValues) =>
            formsControllerContinueFormProcess({
              formProcessId: formProcess.id,
              supposedSigningPartyId: formProcess.my_signing_party_id!,
              values: { ...finalValues, ...signingPartyValues },
              audit: getClientAudit(),
              // ! LOLOLOLOL
              signature: signatureFullName
                ? { fullName: signatureFullName, title: signatureTitle }
                : undefined,
            }).then(() => {
              modalRegistry.specifySigningParties.close();
              modalRegistry.formContinuationSuccess.open();
            }),
          autofillValues
        );

        // Just e-sign and fill-out right away
      } else {
        await formsControllerContinueFormProcess({
          formProcessId: formProcess.id,
          supposedSigningPartyId: formProcess.my_signing_party_id!,
          values: finalValues,
          audit: getClientAudit(),
          // ! LOLOLOLOL
          signature: signatureFullName
            ? { fullName: signatureFullName, title: signatureTitle }
            : undefined,
        });

        await queryClient.invalidateQueries({ queryKey: ["my_forms"] });
        modalRegistry.formContinuationSuccess.open();
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
          <TextLoader loading={busy}>{"Reject Form"}</TextLoader>
        </Button>
      )}
      <Button
        onClick={() => void handleSubmit()}
        variant="default"
        className="w-full text-xs sm:w-auto"
        disabled={busy || !signContext.hasAgreed}
      >
        <TextLoader loading={busy}>{"Submit Form"}</TextLoader>
      </Button>
    </div>
  );
}
