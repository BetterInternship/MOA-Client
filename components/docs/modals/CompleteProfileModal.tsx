"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/docs/forms/EditForm";
import { useSignatoryProfile } from "@/app/docs/auth/provider/signatory.ctx";
import { signatoryControllerUpdateSelf } from "@/app/api/app/api/endpoints/signatory/signatory";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";

export function CompleteProfileModal({ close }: { close: () => void }) {
  const profile = useSignatoryProfile();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name", toastPresets.destructive);
      return;
    }

    try {
      setIsLoading(true);
      await signatoryControllerUpdateSelf({ name: name.trim() });
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile updated!", toastPresets.default);
      close();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile", toastPresets.destructive);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Complete Your Profile</h2>
        <p className="text-sm text-gray-600">
          We need your name to continue. This will be saved to your account.
        </p>
      </div>

      <div>
        <FormInput
          label="Name"
          value={name}
          setter={setName}
          placeholder="Enter your full name"
          autoFocus
          disabled={isLoading}
          required
        />
      </div>

      <Button onClick={handleSubmit} disabled={isLoading || !name.trim()} className="w-full">
        {isLoading ? "Saving..." : "Save & Continue"}
      </Button>
    </div>
  );
}
