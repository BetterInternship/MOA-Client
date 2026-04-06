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
    staleTime: 60_000,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (Unauthorized) - user is logged out
      if (error?.status === 401 || error?.response?.status === 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  useEffect(() => {
    const profile = signatoryProfile.data?.profile;

    if (signatoryProfile.isLoading || signatoryProfile.isFetching) {
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
        message.includes("unauthorized") ||
        message.includes("invalid or expired signatory token");

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
      // Sometimes responses can be empty due to browser cache/proxy quirks.
      // Keep prior identity and avoid forcing logout on ambiguous state.
      setSignatoryContext((prev) => ({ ...prev, loading: false }));
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
    signatoryProfile.isFetching,
  ]);

  return (
    <SignatoryProfileContext.Provider value={signatoryContext}>
      {children}
    </SignatoryProfileContext.Provider>
  );
};
