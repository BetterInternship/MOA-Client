/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-30 07:06:04
 * @ Modified time: 2026-01-01 00:55:01
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
}

const SignatoryProfileContext = createContext({} as ISignatoryProfile);

export const useSignatoryProfile = () => useContext(SignatoryProfileContext);

export const SignatoryProfileContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [signatoryContext, setSignatoryContext] = useState<ISignatoryProfile>(
    {} as ISignatoryProfile
  );

  const signatoryProfile = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => await getSignatorySelf(),
    staleTime: 60_000,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (Unauthorized) - user is logged out
      if (error?.response?.status === 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  useEffect(() => {
    const profile = signatoryProfile.data?.profile;

    // Clear context if there's an error (like 401 after logout) OR no profile
    if (signatoryProfile.status === "error" || !profile) {
      setSignatoryContext({} as ISignatoryProfile);
    } else if (profile) {
      setSignatoryContext({
        ...profile,
        autofill: profile.autofill as Record<string, Record<string, string>>,
        autoFormPermissions: profile.autoFormPermissions as Record<string, string>,
        loading: signatoryProfile.isLoading,
      });
    }
  }, [signatoryProfile.data, signatoryProfile.status, signatoryProfile.error]);

  return (
    <SignatoryProfileContext.Provider value={signatoryContext}>
      {children}
    </SignatoryProfileContext.Provider>
  );
};
