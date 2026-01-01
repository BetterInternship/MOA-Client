import { formsControllerGetFormProcess } from "@/app/api";
import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useState } from "react";

export interface IFormProcess {
  form_label?: string;
  form_name?: string;
  form_version?: number;
  latest_document_url?: string;
  prefilled_document_id?: string;
  signed_document_id?: string;
  display_information?: Record<string, string>;
  timestamp?: string;
  my_signing_party_id?: string;
  setFormProcessId: (formProcessId: string) => void;
}

const FormProcessContext = createContext({} as IFormProcess);

export const useFormProcess = () => useContext(FormProcessContext);

export const FormProcessContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [formProcessId, setFormProcessId] = useState("");
  const { data: _formProcess } = useQuery({
    queryKey: ["form-process"],
    queryFn: useCallback(() => formsControllerGetFormProcess({ formProcessId }), [formProcessId]),
    enabled: !!formProcessId.trim(),
  });

  return (
    <FormProcessContext.Provider
      value={{
        ..._formProcess?.formProcess,
        display_information: _formProcess?.formProcess as unknown as Record<string, string>,
        setFormProcessId,
      }}
    >
      {children}
    </FormProcessContext.Provider>
  );
};
