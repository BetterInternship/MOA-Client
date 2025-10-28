import {
  formsControllerGetLatestFormDocumentAndMetadata,
  formsControllerGetPending,
} from "./app/api/endpoints/forms/forms";
import { FormMetadata, IFormField, IFormMetadata } from "@betterinternship/core/forms";

export const getPendingInformation = async (pendingDocumentId: string) => {
  try {
    const pendingInformation = await formsControllerGetPending({ pendingDocumentId });
    return { pendingInformation, isLoading: false, error: null };
  } catch (error) {
    return { pendingInformation: null, isLoading: false, error };
  }
};

export const getFormFields = async (name: string) => {
  try {
    const res = await formsControllerGetLatestFormDocumentAndMetadata({ name });

    if (!res) {
      return {
        formFields: null,
        isLoading: false,
        error: new Error("Form not found or empty response"),
      };
    }

    const rawAny = res;
    const meta = rawAny.formMetadata;

    if (meta && typeof meta === "object") {
      const fm = new FormMetadata(meta as IFormMetadata);
      const clientFields = fm.getFieldsForClient();

      const molded = {
        name: fm.name,
        formMetadata: {
          schema: clientFields,
        },
      };

      console.log("Molded form fields:", molded);
      return { formFields: molded, isLoading: false, error: null };
    }
  } catch (error) {
    return { formFields: null, isLoading: false, error };
  }
};
