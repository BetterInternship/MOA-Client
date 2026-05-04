/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-30 07:06:04
 * @ Modified time: 2026-05-04 16:28:49
 * @ Description:
 *
 * Makes it easier to manage signatory account state across files.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSignatorySelf } from "@/app/api/docs.api";

interface ISignatoryProfile {
  id: string;
  email: string;
  name: string;
  autofill: Record<string, Record<string, string>>;
  autoFormPermissions: Record<string, string>;
  coordinatorId?: string;
  god?: boolean;
  loading?: boolean;
  unauthorized?: boolean;
}

const SignatoryProfileContext = createContext({} as ISignatoryProfile);

export const useSignatoryProfile = () => useContext(SignatoryProfileContext);

export const SignatoryProfileContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [signatoryContext, setSignatoryContext] = useState<ISignatoryProfile>({
    loading: true,
    unauthorized: false,
  } as ISignatoryProfile);

  const signatoryProfile = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => await getSignatorySelf(),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    const profile = signatoryProfile.data?.profile;

    if (signatoryProfile.isLoading) {
      setSignatoryContext((prev) => ({
        ...prev,
        loading: true,
        unauthorized: false,
      }));
      return;
    }

    if (signatoryProfile.status === "error") {
      const queryError = signatoryProfile.error as Error | null;
      const message = (queryError?.message || "").toLowerCase();
      const isUnauthorizedError =
        message.includes("unauthorized") || message.includes("invalid or expired signatory token");

      if (isUnauthorizedError) {
        setSignatoryContext({
          loading: false,
          unauthorized: true,
        } as ISignatoryProfile);
        return;
      }

      // Preserve last known profile for transient/network errors.
      setSignatoryContext((prev) => ({ ...prev, loading: false }));
      return;
    }

    if (!profile) {
      setSignatoryContext({
        loading: false,
        unauthorized: true,
      } as ISignatoryProfile);
    } else if (profile) {
      setSignatoryContext({
        ...profile,
        autofill: profile.autofill as Record<string, Record<string, string>>,
        autoFormPermissions: profile.autoFormPermissions as Record<string, string>,
        loading: false,
        unauthorized: false,
      });
    }
  }, [
    signatoryProfile.data,
    signatoryProfile.status,
    signatoryProfile.error,
    signatoryProfile.isLoading,
  ]);

  return (
    <SignatoryProfileContext.Provider value={signatoryContext}>
      {children}
    </SignatoryProfileContext.Provider>
  );
};
