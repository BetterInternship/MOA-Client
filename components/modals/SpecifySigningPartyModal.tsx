import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ClientBlock,
  ClientField,
  ClientPhantomField,
  FormErrors,
  FormValues,
  IFormSigningParty,
} from "@betterinternship/core/forms";
import { TextLoader } from "@/components/ui/loader";
import { IFormFiller } from "../docs/forms/form-filler.ctx";
import { getBlockField } from "../docs/forms/utils";
import { FieldRenderer } from "../docs/forms/FieldRenderer";
import { ISignatoryFormSettings } from "@/app/docs/auth/provider/form-settings.ctx";
import { SigningPartyTimeline } from "../docs/forms/SignignPartyTimeline";
import { ChevronDown } from "lucide-react";
export const SpecifySigningPartiesModal = ({
  fields,
  formFiller,
  autofillValues,
  formSettings: initialFormSettings,
  signingPartyBlocks,
  handleSubmit,
  handleUpdateAutofill,
  close,
  signingParties,
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
  signingParties?: IFormSigningParty[];
}) => {
  const [settings, setSettings] = useState<ISignatoryFormSettings>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [signingPartyValues, setSigningPartyValues] = useState<FormValues>({});
  const [busy, setBusy] = useState(false);
  const hasSignature = fields.some((field) => field.type === "signature");
  const [isProcessStoryOpen, setIsProcessStoryOpen] = useState(false);

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
    <div className="flex max-w-prose min-w-[100%] flex-col space-y-2">
      <div className="text-justify text-sm leading-relaxed">
        This form requires signatures from other parties. Enter their emails so we can send the
        form. If you’re also one of the signatories below, you may enter your email again.
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

      {/* Process Story */}
      <button
        onClick={() => setIsProcessStoryOpen(!isProcessStoryOpen)}
        className="hover:text-primary mt-4 flex w-full items-center gap-2 text-xs text-gray-600 transition-colors"
      >
        <span className="">View signing order</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${
            isProcessStoryOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isProcessStoryOpen && (
        <div className="px-2 pb-2">
          <SigningPartyTimeline signingParties={signingParties} />
        </div>
      )}

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
