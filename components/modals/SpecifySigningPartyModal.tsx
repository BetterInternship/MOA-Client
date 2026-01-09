import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ClientBlock,
  ClientField,
  ClientPhantomField,
  FormErrors,
  FormValues,
} from "@betterinternship/core/forms";
import { TextLoader } from "@/components/ui/loader";
import { IFormFiller } from "../docs/forms/form-filler.ctx";
import { getBlockField } from "../docs/forms/utils";
import { FieldRenderer } from "../docs/forms/FieldRenderer";
import { Divider } from "../ui/divider";
import { FormCheckbox } from "../docs/forms/EditForm";
import { ISignatoryFormSettings } from "@/app/docs/auth/provider/form-settings.ctx";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { useMyAutofillUpdate } from "@/hooks/use-my-autofill";

export const SpecifySigningPartiesModal = ({
  fields,
  formFiller,
  autofillValues,
  formSettings: initialFormSettings,
  signingPartyBlocks,
  handleSubmit,
  handleUpdateAutofill,
  close,
}: {
  fields: (ClientField<[any]> | ClientPhantomField<[any]>)[];
  formFiller: IFormFiller;
  autofillValues?: FormValues;
  formSettings: ISignatoryFormSettings;
  signingPartyBlocks: ClientBlock<[any]>[];
  handleSubmit: (
    additionalValues: FormValues,
    formSettings: ISignatoryFormSettings
  ) => Promise<any>;
  handleUpdateAutofill: (finalValues: FormValues) => Promise<any>;
  close: () => void;
}) => {
  const [settings, setSettings] = useState<ISignatoryFormSettings>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [signingPartyValues, setSigningPartyValues] = useState<FormValues>({});
  const [busy, setBusy] = useState(false);
  const hasSignature = fields.some((field) => field.type === "signature");

  const handleClick = async () => {
    setBusy(true);

    // Derive stuff we need
    const signingPartyFields = signingPartyBlocks
      .map((block) => getBlockField(block))
      .filter((field) => !!field);
    const additionalValues = {
      ...autofillValues,
      ...signingPartyValues,
    };

    // Try to validate the emails
    const errors = formFiller.validate([...fields, ...signingPartyFields], additionalValues);
    setErrors(errors);

    if (Object.keys(errors).length) {
      setBusy(false);
      return;
    }

    try {
      // Submit and close modal if okay
      const finalValues = formFiller.getFinalValues(additionalValues);
      await handleSubmit(finalValues, settings);
      if (settings.autofill) await handleUpdateAutofill(finalValues);
    } catch (err) {
      alert(err);
      setBusy(false);
    }

    close();
    setBusy(false);
  };

  return (
    <div className="flex max-w-prose min-w-[100%] flex-col space-y-2 px-5">
      <div className="text-warning py-4 text-sm">
        This form also requires the signature of other parties. <br />
        Specify their emails below so we can send them this form on your behalf.
      </div>

      {signingPartyBlocks.map((block) => {
        const field = getBlockField(block);
        if (!field) return <></>;
        return (
          <FieldRenderer
            field={field}
            value={signingPartyValues[field.field]}
            error={errors[field.field]}
            onChange={(value: string) =>
              setSigningPartyValues({
                ...signingPartyValues,
                [field.field]: value,
              })
            }
          ></FieldRenderer>
        );
      })}

      <div className="mt-10 flex flex-col gap-2 py-2"></div>

      <Divider></Divider>

      <div className="mt-4 flex gap-2 self-end">
        {!busy && (
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
        )}
        <Button disabled={busy} onClick={() => void handleClick()}>
          <TextLoader loading={busy}>Sign and send form</TextLoader>
        </Button>
      </div>
    </div>
  );
};
