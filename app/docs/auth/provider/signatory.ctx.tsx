/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-30 07:06:04
 * @ Modified time: 2025-12-30 07:19:08
 * @ Description:
 *
 * Makes it easier to manage signatory account state across files.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSignatorySelf } from "@/app/api/signatory.api";

interface ISignatoryProfile {
  name: string;
  honorific: string;
  email: string;
  title: string;
  autofill: Record<string, string | Record<string, string>>;
  auto_form_permissions: Record<string, Record<string, string>>;
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
    setSignatoryContext(signatoryProfile.data as ISignatoryProfile);
  }, [signatoryProfile]);

  return (
    <SignatoryProfileContext.Provider value={signatoryContext}>
      {children}
    </SignatoryProfileContext.Provider>
  );
};
