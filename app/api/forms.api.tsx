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

      // add section field derived from the field name (first word before the first '.')
      const clientFieldsWithSection = (clientFields as IFormField[]).map((f) => ({
        ...f,
        section: deriveSection(f.field),
      }));

      const molded = {
        name: fm.name,
        formMetadata: {
          schema: clientFieldsWithSection,
        },
      };

      console.log("Molded form fields:", molded);
      return { formFields: molded, isLoading: false, error: null };
    }
  } catch (error) {
    return { formFields: null, isLoading: false, error };
  }
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
    return { approval: res as ApproveSignatoryResponse, isLoading: false, error: null };
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

// Helpers
const deriveSection = (fieldName: string | undefined): string => {
  if (!fieldName) return "";
  const first = fieldName.split(".")[0];
  if (first === "parent" || first === "guardian") return "parent-guardian";
  if (first === "student" || first === "internship" || first === "entity") return first;
  return first; // fallback to the first segment if needed
};
