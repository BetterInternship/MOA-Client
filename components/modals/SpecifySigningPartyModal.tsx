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
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { IFormFiller } from "../docs/forms/form-filler.ctx";
import { getBlockField } from "../docs/forms/utils";
import { FieldRenderer } from "../docs/forms/FieldRenderer";

export const SpecifySigningPartiesModal = ({
  fields,
  formFiller,
  autofillValues,
  signingPartyBlocks,
  handleSubmit,
  close,
}: {
  fields: (ClientField<[any]> | ClientPhantomField<[any]>)[];
  formFiller: IFormFiller;
  autofillValues?: FormValues;
  signingPartyBlocks: ClientBlock<[any]>[];
  handleSubmit: (signingPartyValues: FormValues) => Promise<any>;
  close: () => void;
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [signingPartyValues, setSigningPartyValues] = useState<FormValues>({});
  const [busy, setBusy] = useState(false);

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

    // Submit and close modal if okay
    await handleSubmit(formFiller.getFinalValues(additionalValues));
    await queryClient.invalidateQueries({ queryKey: ["my_forms"] });
    close();
    setBusy(false);
  };

  return (
    <div className="flex max-w-prose min-w-[100%] flex-col space-y-2">
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

      <Button className="mt-4 self-end" disabled={busy} onClick={() => void handleClick()}>
        <TextLoader loading={busy}>Sign and send form</TextLoader>
      </Button>
    </div>
  );
};
