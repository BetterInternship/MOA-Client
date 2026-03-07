"use client";

import { useFormProcess } from "@/components/docs/forms/form-process.ctx";
import { useFormRendererContext } from "@/components/docs/forms/form-renderer.ctx";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type SignIntentGateProps = {
  onSignSelf: () => void;
  onDelegate: () => void;
};

export function SignIntentGate({ onSignSelf, onDelegate }: SignIntentGateProps) {
  const form = useFormRendererContext();
  const formProcess = useFormProcess();
  const displayInformation = formProcess.display_information as Record<string, string>;
  const documentName = formProcess.form_label;
  const studentName = displayInformation?.["student.full-name:default"];
  const signingParties = form.formMetadata.getSigningParties();
  const signingPartyId = formProcess.my_signing_party_id;
  const signingParty = signingParties.find((signingParty) => signingParty._id === signingPartyId);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full">
        <p className="mx-auto max-w-prose text-left text-lg font-medium text-gray-700">
          <span className="text-primary font-bold">{studentName}</span> has requested you to fill
          out their <span className="text-primary font-bold">{documentName}</span> as{" "}
          <span className="text-primary font-bold">{signingParty?.signatory_title}</span>.
        </p>

        <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="group h-auto min-h-48 w-full flex-col items-stretch gap-0 overflow-hidden p-0 text-base whitespace-normal sm:min-h-56"
            onClick={onSignSelf}
          >
            <div className="flex min-h-32 w-full flex-1 items-center justify-center bg-gray-100 px-6 py-8 transition-colors group-hover:bg-gray-200 sm:min-h-36">
              <div className="bg-primary rounded-full p-6 opacity-85">
                <Image
                  src="/assets/sign-document.png"
                  alt=""
                  width={96}
                  height={96}
                  className="h-16 w-16 translate-y-[-1px] object-contain opacity-80 invert sm:h-20 sm:w-20"
                />
              </div>
            </div>
            <div className="flex w-full flex-col justify-center border-t px-6 py-5 text-left">
              <span>I am the</span>
              <span className="font-semibold">{signingParty?.signatory_title}</span>
            </div>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="group h-auto min-h-48 w-full flex-col items-stretch gap-0 overflow-hidden p-0 text-base whitespace-normal sm:min-h-56"
            onClick={onDelegate}
          >
            <div className="flex min-h-32 w-full flex-1 items-center justify-center bg-gray-100 px-6 py-8 transition-colors group-hover:bg-gray-200 sm:min-h-36">
              <div className="bg-primary rounded-full p-6 opacity-85">
                <Image
                  src="/assets/forward-document.png"
                  alt=""
                  width={96}
                  height={96}
                  className="h-16 w-16 translate-x-1.5 translate-y-1 object-contain opacity-80 invert sm:h-20 sm:w-20"
                />
              </div>
            </div>
            <div className="flex w-full flex-col justify-center border-t px-6 py-5 text-left">
              <span>Forward this to the actual</span>
              <span className="font-semibold">{signingParty?.signatory_title}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
