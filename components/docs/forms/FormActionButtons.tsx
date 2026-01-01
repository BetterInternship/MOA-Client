"use client";

import { Button } from "@/components/ui/button";
import { useFormRendererContext } from "./form-renderer.ctx";
import { useState } from "react";
import { useFormFiller } from "./form-filler.ctx";
import { useMyAutofillUpdate, useMyAutofill } from "@/hooks/use-my-autofill";
import { TextLoader } from "@/components/ui/loader";
import { FormValues } from "@betterinternship/core/forms";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClientAudit } from "@/lib/audit";
import { useSignatoryProfile } from "@/app/docs/auth/provider/signatory.ctx";
import { formsControllerFilloutFormProcess, formsControllerInitiateFormProcess } from "@/app/api";
import useModalRegistry from "@/components/modal-registry";
import { useFormProcess } from "./form-process.ctx";

export function FormActionButtons() {
  const form = useFormRendererContext();
  const formFiller = useFormFiller();
  const formProcess = useFormProcess();
  const autofillValues = useMyAutofill();
  const profile = useSignatoryProfile();
  const modalRegistry = useModalRegistry();
  const updateAutofill = useMyAutofillUpdate();
  const queryClient = useQueryClient();
  const router = useRouter();

  const noEsign = !form.formMetadata.mayInvolveEsign();
  const initiateFormLabel = "Fill out & initiate e-sign";
  const filloutFormLabel = !noEsign ? "Fill out for manual signing" : "Fill out form";

  const [busy, setBusy] = useState<boolean>(false);
  const onWithoutEsignClick = () => void handleSubmit(false);
  const onWithEsignClick = () => void handleSubmit(true);

  /**
   * This submits the form to the server
   * @param withEsign - if true, enables e-sign; if false, does prefill
   * @param _bypassConfirm - internal flag to skip recipient confirmation on re-call
   * @returns
   */
  const handleSubmit = async (withEsign?: boolean) => {
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

      // Iniate e-sign
      if (withEsign) {
        // Check if other parties need to be requested from
        const signingPartyBlocks = form.formMetadata.getSigningPartyBlocks(
          formProcess.my_signing_party_id ?? ""
        );

        // Open request for contacts
        if (signingPartyBlocks.length) {
          modalRegistry.specifySigningParties.open(
            form.fields,
            formFiller,
            signingPartyBlocks,
            (signingPartyValues: FormValues) =>
              formsControllerInitiateFormProcess({
                formName: form.formName,
                formVersion: form.formVersion,
                values: { ...finalValues, ...signingPartyValues },
                audit: getClientAudit(),
              }),
            autofillValues
          );

          // Just e-sign and fill-out right away
        } else {
          // ! does this still need an audit? it's just generating a pdf without sigs
          await formsControllerInitiateFormProcess({
            formName: form.formName,
            formVersion: form.formVersion,
            values: finalValues,
            audit: getClientAudit(),
          });

          await queryClient.invalidateQueries({ queryKey: ["my_forms"] });
          router.push("/forms/history");
        }

        // Just fill out form
      } else {
        await formsControllerFilloutFormProcess({
          formName: form.formName,
          formVersion: form.formVersion,
          values: finalValues,
          audit: getClientAudit(),
        });

        await queryClient.invalidateQueries({ queryKey: ["my_forms"] });
        router.push("/forms/history");
      }

      setBusy(false);
    } catch (e) {
      console.error("Submission error", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-start justify-end gap-2 pt-2">
      <Button
        onClick={onWithoutEsignClick}
        variant={noEsign ? "default" : "outline"}
        className="w-full text-xs sm:w-auto"
        disabled={busy}
      >
        <TextLoader loading={busy}>{filloutFormLabel}</TextLoader>
      </Button>

      {!noEsign && (
        <Button onClick={onWithEsignClick} className="w-full text-xs sm:w-auto" disabled={busy}>
          <TextLoader loading={busy}>{initiateFormLabel}</TextLoader>
        </Button>
      )}
    </div>
  );
}
