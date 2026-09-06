"use client";

import { FormRendererContextProvider } from "@/components/docs/forms/form-renderer.ctx";
import { ModalProvider } from "../providers/modal-provider";
import { FieldTemplateContextProvider } from "../contexts/field-template.ctx";
import { SignatoryProfileContextProvider } from "./auth/provider/signatory.ctx";
import { FormFillerContextProvider } from "@/components/docs/forms/form-filler.ctx";
import { FormProcessContextProvider } from "@/components/docs/forms/form-process.ctx";
import { SignContextProvider } from "./auth/provider/sign.ctx";
import { MyFormsContextProvider } from "@/components/docs/forms/myforms.ctx";
import { FormSettingsProvider } from "./auth/provider/form-settings.ctx";
import { AppContextProvider } from "@/lib/ctx-app";
import { MQJobsProvider } from "@betterinternship/components";
import { pollMqJob } from "@/lib/api/mq-jobs";
import { SignJobsProvider } from "@/components/docs/forms/signJobs.ctx";

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
                    <MQJobsProvider poll={pollMqJob}>
                      <SignJobsProvider>
                        <AppContextProvider>
                          <ModalProvider>{children}</ModalProvider>
                        </AppContextProvider>
                      </SignJobsProvider>
                    </MQJobsProvider>
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
