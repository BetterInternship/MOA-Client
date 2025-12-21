"use client";

import { FormContextProvider } from "@/components/docs/forms/form.ctx";
import { ModalProvider } from "../providers/modal-provider";
import { FieldTemplateContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { FormEditorContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/form-editor.ctx";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <FieldTemplateContextProvider>
      <FormEditorContextProvider>
        <FormContextProvider>
          <ModalProvider>{children}</ModalProvider>
        </FormContextProvider>
      </FormEditorContextProvider>
    </FieldTemplateContextProvider>
  );
};
