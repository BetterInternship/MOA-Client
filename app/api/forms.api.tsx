import {
  formsControllerGetLatestFormDocumentAndMetadata,
  formsControllerGetPending,
} from "./app/api/endpoints/forms/forms";

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

    const formFields = res?.formLatest ?? res?.data?.formLatest ?? null;

    if (!formFields) {
      return {
        formFields: null,
        isLoading: false,
        error: new Error("Form not found or empty response"),
      };
    }

    return { formFields, isLoading: false, error: null };
  } catch (error) {
    return { formFields: null, isLoading: false, error };
  }
};
