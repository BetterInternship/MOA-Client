/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-11-09 03:23:23
 * @ Modified by: Your name
 * @ Modified time: 2025-12-18 15:09:27
 *
 * Allows us to access field information.
 * Seems like we'll be using this a lot in the editor.
 */

import { FieldRegistryEntry, useFormsControllerGetFieldRegistry } from "@/app/api";
import { createContext, useContext } from "react";

// Context interface
export interface IFieldTemplateContext {
  registry: FieldRegistryEntry[];
  getFieldLabel: (fieldId: string) => string;
}

// Context defs
const FieldTemplateContext = createContext<IFieldTemplateContext>({} as IFieldTemplateContext);
export const useFieldTemplateContext = () => useContext(FieldTemplateContext);

/**
 * Utility function to get field label by ID
 */
export const getFieldLabel = (fieldId: string, registry: FieldRegistryEntry[]): string => {
  return registry.find((r) => r.id === fieldId)?.label || fieldId;
};

/**
 * Gives access to data bank of field templates
 *
 * @component
 * @provider
 */
export const FieldTemplateContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: registry } = useFormsControllerGetFieldRegistry();
  const registryArray = registry?.fields ?? [];

  const fieldTemplateContext: IFieldTemplateContext = {
    registry: registryArray,
    getFieldLabel: (fieldId: string) => getFieldLabel(fieldId, registryArray),
  };

  return (
    <FieldTemplateContext.Provider value={fieldTemplateContext}>
      {children}
    </FieldTemplateContext.Provider>
  );
};
