/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-30 07:06:04
 * @ Modified time: 2025-12-31 22:19:48
 * @ Description:
 *
 * Makes it easier to manage signatory account state across files.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSignatorySelf } from "@/app/api/docs.api";

interface ISignatoryProfile {
  sub: string;
  email: string;
  name: string;
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
  });

  useEffect(() => {
    if (signatoryProfile.data?.profile) {
      setSignatoryContext({
        ...signatoryProfile.data.profile,
        loading: signatoryProfile.isLoading,
      });
    }
  }, [signatoryProfile]);

  return (
    <SignatoryProfileContext.Provider value={signatoryContext}>
      {children}
    </SignatoryProfileContext.Provider>
  );
};
