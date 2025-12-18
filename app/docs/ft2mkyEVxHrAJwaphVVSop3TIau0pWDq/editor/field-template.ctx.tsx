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
  const entry = registry.find((r) => r.id === fieldId);
  return (entry?.label as string | undefined) ?? fieldId;
};

/**
 * Utility function to get field name by ID
 */
export const getFieldName = (fieldId: string, registry: FieldRegistryEntry[]): string => {
  const entry = registry.find((r) => r.id === fieldId);
  return entry?.name ?? fieldId;
};

/**
 * Utility function to get field label by name
 */
export const getFieldLabelByName = (fieldName: string, registry: FieldRegistryEntry[]): string => {
  const entry = registry.find((r) => r.name === fieldName);
  return (entry?.label as string | undefined) ?? fieldName;
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
