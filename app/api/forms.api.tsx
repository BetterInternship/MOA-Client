import {
  formsControllerGetLatestFormDocumentAndMetadata,
  formsControllerGetPending,
  formsControllerApproveSignatory,
} from "./app/api/endpoints/forms/forms";
import { FormMetadata, IFormField, IFormMetadata } from "@betterinternship/core/forms";
import { formsControllerGetSignedDocumentsBySignatory } from "./app/api/endpoints/forms/forms";

export const getPendingInformation = async (pendingDocumentId: string) => {
  try {
    const pendingInformation = await formsControllerGetPending({ pendingDocumentId });
    return { pendingInformation, isLoading: false, error: null };
  } catch (error) {
    return { pendingInformation: null, isLoading: false, error };
  }
};

export const getFormFields = async (name: string) => {
  return await formsControllerGetLatestFormDocumentAndMetadata({ name });
};

export type ApproveSignatoryRequest = {
  pendingDocumentId: string;
  signatoryName: string;
  signatoryTitle: string;
  party: "student" | "entity" | "student-guardian" | "university";
  values?: Record<string, string>;
};

export type ApproveSignatoryResponse = {
  message?: string;
  signedDocumentId?: string;
  signedDocumentUrl?: string;
  [k: string]: any;
};

export const approveSignatory = async (payload: ApproveSignatoryRequest) => {
  try {
    const approveFn = formsControllerApproveSignatory as unknown as (
      data: ApproveSignatoryRequest
    ) => Promise<ApproveSignatoryResponse>;

    const res = await approveFn(payload);
    return { approval: res, isLoading: false, error: null };
  } catch (error) {
    return { approval: null, isLoading: false, error };
  }
};

export const getAllSignedForms = async () => {
  try {
    const res = await formsControllerGetSignedDocumentsBySignatory();
    const signedDocuments = res?.signedDocuments ?? [];
    return { signedDocuments, isLoading: false, error: null };
  } catch (error) {
    return { signedDocuments: null, isLoading: false, error };
  }
};
