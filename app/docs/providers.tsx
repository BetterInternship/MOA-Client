"use client";

import { FormRendererContextProvider } from "@/components/docs/forms/form-renderer.ctx";
import { ModalProvider } from "../providers/modal-provider";
import { FieldTemplateContextProvider } from "./ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { FormEditorContextProvider } from "../../components/editor/form-editor.ctx";
import { SignatoryProfileContextProvider } from "./auth/provider/signatory.ctx";
import { FormFillerContextProvider } from "@/components/docs/forms/form-filler.ctx";
import { FormProcessContextProvider } from "@/components/docs/forms/form-process.ctx";
import { SignContextProvider } from "./auth/provider/sign.ctx";
import { MyFormsContextProvider } from "@/components/docs/forms/myforms.ctx";
import { FormSettingsProvider } from "./auth/provider/form-settings.ctx";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <FieldTemplateContextProvider>
      <FormRendererContextProvider>
        <FormProcessContextProvider>
          <FormFillerContextProvider>
            <FormSettingsProvider>
              <SignatoryProfileContextProvider>
                <SignContextProvider>
                  <MyFormsContextProvider>
                    <ModalProvider>{children}</ModalProvider>
                  </MyFormsContextProvider>
                </SignContextProvider>
              </SignatoryProfileContextProvider>
            </FormSettingsProvider>
          </FormFillerContextProvider>
        </FormProcessContextProvider>
      </FormRendererContextProvider>
    </FieldTemplateContextProvider>
  );
};
