/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-30 07:06:04
 * @ Modified time: 2026-01-09 20:47:29
 * @ Description:
 *
 * Makes it easier to manage signatory form settings.
 */

import {
  signatoryControllerGetSignatoryFormSettings,
  signatoryControllerSetSignatoryFormSettings,
} from "@/app/api";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";

export interface ISignatoryFormSettings {
  [key: string]: {
    autosign?: boolean; // Apply autosign -> sign automatically if only signature is needed
    autofill?: boolean; // Save autofill and use for succeeding forms
  };
}

interface IFormSettings {
  getFormSettings: (formName: string) => Promise<ISignatoryFormSettings>;
  updateFormSettings: (
    formName: string,
    settings: Partial<ISignatoryFormSettings>
  ) => Promise<void>;
}

const FormSettingsContext = createContext({} as IFormSettings);

export const useFormSettings = () => useContext(FormSettingsContext);

export const FormSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  /**
   * Gets the form settings for a form.
   *
   * @param formName
   * @returns
   */
  const getFormSettings = async (formName: string) => {
    const data = await queryClient.ensureQueryData({
      queryKey: ["form-settings", formName],
      queryFn: () =>
        signatoryControllerGetSignatoryFormSettings({
          formName: formName,
        }),
    });

    return data.settings;
  };

  /**
   * Updates the form settings in the db for a form.
   *
   * @param formName
   * @param settings
   */
  const updateFormSettings = async (
    formName: string,
    settings: Partial<ISignatoryFormSettings>
  ) => {
    const result = await signatoryControllerSetSignatoryFormSettings({
      formName,
      settings,
    });

    if (!result.success) {
      alert(result.message);
    } else {
      await queryClient.invalidateQueries({ queryKey: ["form-settings", formName] });
      await queryClient.refetchQueries({ queryKey: ["form-settings", formName], exact: true });
    }

    return result;
  };

  return (
    <FormSettingsContext.Provider
      value={{
        getFormSettings,
        updateFormSettings,
      }}
    >
      {children}
    </FormSettingsContext.Provider>
  );
};
