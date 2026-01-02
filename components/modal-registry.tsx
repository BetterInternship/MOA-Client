import { useModal } from "@/app/providers/modal-provider";
import {
  ClientBlock,
  ClientField,
  ClientPhantomField,
  FormValues,
} from "@betterinternship/core/forms";
import { IFormFiller } from "./docs/forms/form-filler.ctx";
import { SpecifySigningPartiesModal } from "./modals/SpecifySigningPartyModal";
import { useRouter } from "next/navigation";
import { FormContinuationSuccessModal } from "./modals/FormContinuationSuccessModal";
import { FormRejectionPromptModal } from "./modals/FormRejectionPromptModal";

/**
 * Simplifies modal config since we usually reuse each of these modal stuffs.
 *
 * @returns
 */
export const useModalRegistry = () => {
  const { openModal: open, closeModal: close } = useModal();
  const router = useRouter();

  const modalRegistry = {
    // Email confirmation modal
    specifySigningParties: {
      open: (
        fields: (ClientField<[any]> | ClientPhantomField<[any]>)[],
        formFiller: IFormFiller,
        signingPartyBlocks: ClientBlock<[any]>[],
        handleSubmit: (signingPartyValues: FormValues) => Promise<any>,
        autofillValues?: FormValues
      ) =>
        open(
          "specify-signing-parties",
          <SpecifySigningPartiesModal
            fields={fields}
            formFiller={formFiller}
            signingPartyBlocks={signingPartyBlocks}
            handleSubmit={handleSubmit}
            close={() => close("specify-signing-parties")}
            autofillValues={autofillValues}
          />,
          {
            title: "Next Signing Parties",
            showHeaderDivider: true,
          }
        ),
      close: () => close("specify-signing-parties"),
    },

    // Appears when a form has successfully been submitted
    formContinuationSuccess: {
      open: () =>
        open("form-continuation-success", <FormContinuationSuccessModal />, {
          title: "Form Successfully Submitted",
          hasClose: false,
          allowBackdropClick: false,
        }),
      close: () => close("form-continuation-success"),
    },

    formRejectionPrompt: {
      open: (formProcessId: string) =>
        open("form-rejection-prompt", <FormRejectionPromptModal formProcessId={formProcessId} />, {
          title: "Reject to Sign This Form",
        }),
      close: () => close("form-rejection-prompt"),
    },
  };

  return modalRegistry;
};

export default useModalRegistry;
