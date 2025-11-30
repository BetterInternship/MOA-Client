import {
  formsControllerGetLatestFormDocumentAndMetadata,
  formsControllerGetPending,
  formsControllerApproveSignatory,
  formsControllerGenerateForm,
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

export type Party = "student" | "entity" | "student-guardian" | "university";

export type ApproveSignatoryRequest = {
  pendingDocumentId: string;
  signatories: {
    name: string;
    title: string;
    party: string;
    status?: string;
    email?: string;
    honorific?: string;
  }[];
  party: Party;
  values?: Record<string, string>;
};

export type ApproveSignatoryResponse = {
  message?: string;
  signedDocumentId?: string;
  signedDocumentUrl?: string;
  [k: string]: any;
};

export const approveSignatory = async (data: ApproveSignatoryRequest) => {
  try {
    const res = await formsControllerApproveSignatory(data);
    const approval: ApproveSignatoryResponse | null = res ?? null;
    return { approval, isLoading: false, error: null };
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

export const requestGenerateForm = async (data: {
  formName: string;
  formVersion?: number;
  values: Record<string, string>;
  signatories?: { name: string; title: string }[];
  parties?: {
    userId?: string | null;
    employerId?: string | null;
    universityId?: string | null;
  };
  disableEsign?: boolean;
}) => {
  try {
    const res = await formsControllerGenerateForm(data);
    return { response: res, isLoading: false, error: null };
  } catch (error) {
    return { response: null, isLoading: false, error };
  }
};
