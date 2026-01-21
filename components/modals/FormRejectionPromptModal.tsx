import { useState } from "react";
import { FormTextarea } from "../docs/forms/EditForm";
import { Button } from "../ui/button";
import useModalRegistry from "../modal-registry";
import { formsControllerRejectFormProcess } from "../../app/api/app/api/endpoints/forms/forms";
import { TextLoader } from "../ui/loader";
import { useRouter } from "next/navigation";

export const FormRejectionPromptModal = ({ formProcessId }: { formProcessId: string }) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const modalRegistry = useModalRegistry();
  const router = useRouter();

  const handleReject = async () => {
    setLoading(true);
    const response = await formsControllerRejectFormProcess({
      formProcessId,
      reason,
    });

    if (response.success) {
      alert("Successfully rejected form.");
      modalRegistry.formRejectionPrompt.close();
      router.push("/dashboard");
      setLoading(false);
    } else {
      alert("Could not reject form: " + response.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center space-y-5">
      <span>
        Provide a valid reason why you wish not to fill this form. We will inform the person who
        initiated this form through email.
      </span>
      <FormTextarea
        className="w-full text-lg"
        placeholder={'e.g. "This form has incorrect values for these fields."'}
        value={reason}
        setter={setReason}
      ></FormTextarea>
      <div className="flex w-full flex-row gap-2">
        <Button
          className="flex-1"
          scheme="destructive"
          disabled={!reason.trim()}
          onClick={() => {
            void handleReject();
          }}
        >
          <TextLoader loading={loading}>{"Reject"}</TextLoader>
        </Button>
        <Button
          className="flex-1"
          scheme="secondary"
          onClick={() => modalRegistry.formRejectionPrompt.close()}
        >
          Close
        </Button>
      </div>
    </div>
  );
};
