"use client";

import { useCallback, useState } from "react";
import { useFormProcess } from "@/components/docs/forms/form-process.ctx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formsControllerAlterRecipient } from "../../../api/app/api/endpoints/forms/forms";

type DelegateEmailScreenProps = {
  email: string;
  onEmailChange: (value: string) => void;
};

export function DelegateEmailScreen({ email, onEmailChange }: DelegateEmailScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formProcess = useFormProcess();

  const handleSubmit = useCallback(async () => {
    const recipientEmail = email.trim();
    const mySigningPartyId = formProcess.my_signing_party_id;

    if (!recipientEmail) {
      toast.error("Enter an email address first.");
      return;
    }

    if (!mySigningPartyId) {
      toast.error("Broken URL. Check that you used the correct link.");
      return;
    }

    try {
      setIsSubmitting(true);
      await formsControllerAlterRecipient({
        formProcessId: formProcess.id,
        supposedSigningPartyId: mySigningPartyId,
        recipientEmail,
      });
      toast.success("Delegation request sent.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message.replace("Error: ", "") : "Failed to send request.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formProcess]);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-xl space-y-4">
        <p className="text-center text-base font-medium text-gray-700 sm:text-lg">
          Enter the email address of the person who should sign this document.
        </p>
        <Input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="name@example.com"
          className="h-12 text-base"
        />
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
