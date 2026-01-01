"use client";

import { FormRendererContextProvider } from "@/components/docs/forms/form-renderer.ctx";
import { ModalProvider } from "../providers/modal-provider";
import { FieldTemplateContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { FormEditorContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/form-editor.ctx";
import { SignatoryProfileContextProvider } from "./auth/provider/signatory.ctx";
import { FormFillerContextProvider } from "@/components/docs/forms/form-filler.ctx";
import { FormProcessContextProvider } from "@/components/docs/forms/form-process.ctx";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <FieldTemplateContextProvider>
      <FormEditorContextProvider>
        <FormRendererContextProvider>
          <FormProcessContextProvider>
            <FormFillerContextProvider>
              <SignatoryProfileContextProvider>
                <ModalProvider>{children}</ModalProvider>
              </SignatoryProfileContextProvider>
            </FormFillerContextProvider>
          </FormProcessContextProvider>
        </FormRendererContextProvider>
      </FormEditorContextProvider>
    </FieldTemplateContextProvider>
  );
};
