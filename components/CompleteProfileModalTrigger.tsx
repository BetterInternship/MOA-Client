"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSignatoryProfile } from "@/app/docs/auth/provider/signatory.ctx";
import useModalRegistry from "@/components/modal-registry";

/**
 * Handles opening the complete profile modal when needed
 * Placed in a separate component to ensure profile context is loaded
 */
export function CompleteProfileModalTrigger() {
  const pathname = usePathname();
  const profile = useSignatoryProfile();
  const modalRegistry = useModalRegistry();

  useEffect(() => {
    // Only proceed if profile is loaded
    if (!profile?.id) {
      return;
    }

    // Check if on dashboard or forms page and user has no name
    if (!profile.name && (pathname?.includes("/dashboard") || pathname?.includes("/forms"))) {
      modalRegistry.completeProfile.open();
    }
  }, [profile?.id, profile?.name, pathname]);

  return null;
}
