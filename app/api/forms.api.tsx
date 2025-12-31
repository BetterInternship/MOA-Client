import {
  formsControllerGetLatestFormDocumentAndMetadata,
  formsControllerGetPending,
  formsControllerApproveSignatory,
} from "./app/api/endpoints/forms/forms";
import { signatoryControllerGetSignedDocumentsBySignatory } from "./app/api/endpoints/signatory/signatory";

export const getPendingInformation = async (formProcessId: string) => {
  try {
    const pendingInformation = await formsControllerGetPending({ formProcessId: formProcessId });
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
  pendingFormId: string;
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
    const res = await signatoryControllerGetSignedDocumentsBySignatory();
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
    // ! reimplement this part, call the correct route
    await Promise.resolve("lol");
    return { response: {}, isLoading: false, error: null };
  } catch (error) {
    return { response: null, isLoading: false, error };
  }
};
