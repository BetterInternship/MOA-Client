"use client";

import { ModalProvider } from "../providers/modal-provider";
import { FieldTemplateContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { FormContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/form.ctx";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <FieldTemplateContextProvider>
      <FormContextProvider>
        <ModalProvider>{children}</ModalProvider>
      </FormContextProvider>
    </FieldTemplateContextProvider>
  );
};
