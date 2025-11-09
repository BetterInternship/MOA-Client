/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-11-09 03:23:23
 * @ Modified time: 2025-11-09 03:34:19
 * @ Description:
 *
 * Allows us to access field information.
 * Seems like we'll be using this a lot in the editor.
 */

import { FieldRegistryEntry, useFormsControllerGetFieldRegistry } from "@/app/api";
import { createContext, useContext } from "react";

// Context interface
export interface IFieldTemplateContext {
  registry: FieldRegistryEntry[];
}

// Context defs
const FieldTemplateContext = createContext<IFieldTemplateContext>({} as IFieldTemplateContext);
export const useFieldTemplateContext = () => useContext(FieldTemplateContext);

/**
 * Gives access to data bank of field templates
 *
 * @component
 * @provider
 */
export const FieldTemplateContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: registry } = useFormsControllerGetFieldRegistry();
  const fieldTemplateContext: IFieldTemplateContext = {
    registry: registry?.fields ?? [],
  };

  return (
    <FieldTemplateContext.Provider value={fieldTemplateContext}>
      {children}
    </FieldTemplateContext.Provider>
  );
};
