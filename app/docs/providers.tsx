"use client";

import { FormRendererContextProvider } from "@/components/docs/forms/form-renderer.ctx";
import { ModalProvider } from "../providers/modal-provider";
import { FieldTemplateContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { FormEditorContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/form-editor.ctx";
import { SignatoryProfileContextProvider } from "./auth/provider/signatory.ctx";
import { FormFillerContextProvider } from "@/components/docs/forms/form-filler.ctx";
import { FormProcessContextProvider } from "@/components/docs/forms/form-process.ctx";
import { SignContextProvider } from "./auth/provider/sign.ctx";
import { MyFormsContextProvider } from "@/components/docs/forms/myforms.ctx";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <FieldTemplateContextProvider>
      <FormEditorContextProvider>
        <FormRendererContextProvider>
          <FormProcessContextProvider>
            <FormFillerContextProvider>
              <SignatoryProfileContextProvider>
                <SignContextProvider>
                  <MyFormsContextProvider>
                    <ModalProvider>{children}</ModalProvider>
                  </MyFormsContextProvider>
                </SignContextProvider>
              </SignatoryProfileContextProvider>
            </FormFillerContextProvider>
          </FormProcessContextProvider>
        </FormRendererContextProvider>
      </FormEditorContextProvider>
    </FieldTemplateContextProvider>
  );
};
