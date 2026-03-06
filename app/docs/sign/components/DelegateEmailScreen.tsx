"use client";

import { Input } from "@/components/ui/input";

type DelegateEmailScreenProps = {
  email: string;
  onEmailChange: (value: string) => void;
};

export function DelegateEmailScreen({ email, onEmailChange }: DelegateEmailScreenProps) {
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
      </div>
    </div>
  );
}
