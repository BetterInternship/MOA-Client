import { formsControllerGetPending } from "./app/api/endpoints/forms/forms";

export const getPendingInformation = async (pendingDocumentId: string) => {
  try {
    const pendingInformation = await formsControllerGetPending({ pendingDocumentId });
    return { pendingInformation, isLoading: false, error: null };
  } catch (error) {
    return { pendingInformation: null, isLoading: false, error };
  }
};
