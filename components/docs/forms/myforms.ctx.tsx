/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-18 15:17:08
 * @ Modified time: 2026-01-07 10:24:13
 * @ Description:
 *
 * These are the forms a user has generated or initiated.
 */

"use client";

import { getAllSignedForms } from "@/app/api/forms.api";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";

export interface IMyForm {
  label: string;
  form_process_id: string;
  prefilled_document_id?: string | null;
  pending_document_id?: string | null;
  signed_document_id?: string | null;
  latest_document_url?: string | null;
  timestamp: string;
  rejection_reason?: string;
  display_information?: Record<string, string>;
}

interface IMyForms {
  forms: IMyForm[];
  loading: boolean;
  error?: string;
}

const MyFormsContext = createContext<IMyForms>({} as IMyForms);

export const useMyForms = () => useContext<IMyForms>(MyFormsContext);

export const MyFormsContextProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: forms,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-forms"],
    queryFn: async () => {
      const res = await getAllSignedForms();
      return res?.forms ?? [];
    },
    // ! place this in env
    staleTime: 1 * 60 * 1000,
    gcTime: 1 * 60 * 1000,
  });

  const mappedForms =
    forms
      ?.filter((f) => !!f.form_processes)
      ?.map((f) => ({
        label: f.form_label,
        form_process_id: f.form_process_id,
        prefilled_document_id: f.form_processes.prefilled_document_id,
        pending_document_id: f.form_processes.pending_document_id,
        signed_document_id: f.form_processes.signed_document_id,
        latest_document_url: f.form_processes.latest_document_url,
        rejection_reason: f.form_processes.rejection_reason,
        display_information: f.form_processes.display_information,
        timestamp: f.timestamp,
      })) ?? [];

  return (
    <MyFormsContext.Provider
      value={{
        forms: mappedForms,
        loading: isLoading,
        error: error?.message,
      }}
    >
      {children}
    </MyFormsContext.Provider>
  );
};
