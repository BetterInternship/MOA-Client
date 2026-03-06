"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

type SignIntentGateProps = {
  onSignSelf: () => void;
  onDelegate: () => void;
};

export function SignIntentGate({ onSignSelf, onDelegate }: SignIntentGateProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full">
        <p className="text-center text-base font-medium text-gray-700 sm:text-lg">
          A student has requested your signature for this document.
        </p>

        <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-auto min-h-48 w-full flex-col gap-4 px-6 py-6 text-base font-semibold whitespace-normal sm:min-h-56 sm:text-lg"
            onClick={onSignSelf}
          >
            <div className="bg-primary rounded-full p-6 opacity-85">
              <Image
                src="/assets/sign-document.png"
                alt=""
                width={96}
                height={96}
                className="h-16 w-16 translate-y-[-1px] object-contain opacity-80 invert sm:h-20 sm:w-20"
              />
            </div>
            <span>I will sign this document</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-auto min-h-48 w-full flex-col gap-4 px-6 py-6 text-base font-semibold whitespace-normal sm:min-h-56 sm:text-lg"
            onClick={onDelegate}
          >
            <div className="bg-primary rounded-full p-6 opacity-85">
              <Image
                src="/assets/forward-document.png"
                alt=""
                width={96}
                height={96}
                className="h-16 w-16 translate-x-1.5 translate-y-1 object-contain opacity-80 invert sm:h-20 sm:w-20"
              />
            </div>
            <span>I will send this to someone else who will sign</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
