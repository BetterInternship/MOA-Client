import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ClientBlock,
  ClientField,
  ClientPhantomField,
  FormErrors,
  FormValues,
} from "@betterinternship/core/forms";
import { IFormFiller } from "../docs/forms/form-filler.ctx";
import { FormCheckbox } from "../docs/forms/EditForm";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { ISignatoryFormSettings } from "@/app/docs/auth/provider/form-settings.ctx";
import { TextLoader } from "../ui/loader";

export const SetupFormSettings = ({
  fields,
  formFiller,
  autofillValues,
  formSettings: initialFormSettings,
  handleSubmit,
  handleUpdateAutofill,
  close,
}: {
  fields: (ClientField<[any]> | ClientPhantomField<[any]>)[];
  formFiller: IFormFiller;
  autofillValues?: FormValues;
  formSettings: ISignatoryFormSettings;
  handleSubmit: (finalValues: FormValues, formSettings: ISignatoryFormSettings) => Promise<any>;
  handleUpdateAutofill: (finalValues: FormValues) => Promise<any>;
  close: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<ISignatoryFormSettings>({});
  const hasSignature = fields.some((field) => field.type === "signature");

  const handleClick = async () => {
    setBusy(true);
    try {
      const finalValues = formFiller.getFinalValues(autofillValues);
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
    <div className="px-5">
      <div className="mt-5 flex flex-col gap-2 py-2">
        {!initialFormSettings.autosign && hasSignature && (
          <div
            className="flex flex-row items-center gap-2 hover:cursor-pointer"
            onClick={() => setSettings({ ...settings, autosign: !settings.autosign })}
          >
            <FormCheckbox checked={settings.autosign} />
            <div className="text-primary flex flex-col italic">
              <AnimatedShinyText>
                Automatically sign on my behalf for future requests of this form?
              </AnimatedShinyText>
            </div>
          </div>
        )}

        {!initialFormSettings.autofill && (
          <div
            className="flex flex-row items-center gap-2 hover:cursor-pointer"
            onClick={() => setSettings({ ...settings, autofill: !settings.autofill })}
          >
            <FormCheckbox checked={settings.autofill} />
            <div className="text-primary flex flex-col italic">
              <AnimatedShinyText>
                Save my information for future fillouts of this form?
              </AnimatedShinyText>
            </div>
          </div>
        )}
      </div>

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
