import { formsControllerGetFormProcess } from "@/app/api";
import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useState } from "react";

export interface IFormProcess {
  id: string;
  form_label?: string;
  form_name?: string;
  form_version?: number;
  latest_document_url?: string;
  prefilled_document_id?: string;
  signed_document_id?: string;
  display_information?: Record<string, string>;
  timestamp?: string;
  my_signing_party_id?: string;

  setSupposedSigningPartyId: (supposedSigningPartyId: string) => void;
  setFormProcessId: (formProcessId: string) => void;
  error?: string;
}

const FormProcessContext = createContext({} as IFormProcess);

export const useFormProcess = () => useContext(FormProcessContext);

export const FormProcessContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [formProcessId, setFormProcessId] = useState("");
  const [supposedSigningPartyId, setSupposedSigningPartyId] = useState("");
  const { data: _formProcess } = useQuery({
    queryKey: ["form-process", formProcessId],
    queryFn: useCallback(
      () =>
        formsControllerGetFormProcess({
          formProcessId,
          signingPartyId: supposedSigningPartyId,
        }).catch((e) => ({ formProcess: undefined, message: e as string })),
      [formProcessId, supposedSigningPartyId]
    ),
    enabled: !!formProcessId.trim(),
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return (
    <FormProcessContext.Provider
      value={{
        ..._formProcess?.formProcess,
        id: formProcessId,
        display_information: _formProcess?.formProcess as unknown as Record<string, string>,

        setFormProcessId,
        setSupposedSigningPartyId,
        error: _formProcess?.message,
      }}
    >
      {children}
    </FormProcessContext.Provider>
  );
};
