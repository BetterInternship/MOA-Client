import { formGroupsControllerGetAllFormGroups } from "./app/api/endpoints/form-groups/form-groups";
import {
  formsControllerGetLatestFormDocumentAndMetadata,
  formsControllerApproveSignatory,
} from "./app/api/endpoints/forms/forms";
import { signatoryControllerGetSignedDocumentsBySignatory } from "./app/api/endpoints/signatory/signatory";
import {
  formGroupsControllerAddFormToGroup,
  formGroupsControllerCreateFormGroup,
} from "./app/api/endpoints/form-groups/form-groups";
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

export const fetchAllFormGroups = async () => {
  try {
    const res = await formGroupsControllerGetAllFormGroups();
    const groups = res?.groups ?? [];
    return { groups, isLoading: false, error: null };
  } catch (error) {
    return { groups: null, isLoading: false, error };
  }
};

export const createFormGroup = async (name: string) => {
  try {
    const res = await formGroupsControllerCreateFormGroup({
      body: { name },
    });
    const group = res?.response ?? null;
    return { group, isLoading: false, error: null };
  } catch (error) {
    return { group: null, isLoading: false, error };
  }
};

export const addFormToGroup = async (formName: string, groupId: string) => {
  console.log("API call to addFormToGroup with", { formName, groupId });
  try {
    const res = await formGroupsControllerAddFormToGroup({
      body: { formName, groupId },
    });
    const result = res?.response ?? null;
    return { result, isLoading: false, error: null };
  } catch (error) {
    return { result: null, isLoading: false, error };
  }
};
