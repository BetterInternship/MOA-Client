import {
  authControllerDocsLoginRequest,
  authControllerDocsLoginVerify,
  authControllerDocsSelf,
  authControllerDocsSignOut,
} from "./app/api/endpoints/auth/auth";
import { docsLinkLoginControllerLinkLogin } from "./app/api/endpoints/docs-link-login/docs-link-login";
import { docsControllerGetEntityForms } from "./app/api/endpoints/docs/docs";

export const requestLoginOtp = async (email: string) => {
  try {
    // server expects { email }
    const res = await authControllerDocsLoginRequest({ email });
    // res shape: { ok: boolean, resendIn?: number, ttl?: number, reason?: string }
    return { ...res, isLoading: false, error: null };
  } catch (error) {
    return { ok: false, isLoading: false, error };
  }
};

export const verifyLoginOtp = async (email: string, otp: string) => {
  try {
    // server expects { email, code }
    const res = await authControllerDocsLoginVerify({ email, code: otp });
    // server sets a cookie (docs-token) and returns { ok: boolean }
    return { ...res, isLoading: false, error: null };
  } catch (error) {
    return { ok: false, isLoading: false, error };
  }
};

export const getDocsSelf = async () => {
  try {
    const res = await authControllerDocsSelf();
    return { ...res, isLoading: false, error: null };
  } catch (error) {
    return { ok: false, profile: null, isLoading: false, error };
  }
};

export const autoLogin = async (params: {
  email: string;
  id?: string;
  name?: string;
  form?: string;
  aud?: "entity" | "student-guardian" | "university";
  pending?: string;
  student?: string;
}) => {
  try {
    const { id, email, name, form, aud, pending, student } = params;
    const res = await docsLinkLoginControllerLinkLogin({
      id,
      email,
      name,
      form,
      for: aud,
      pending,
      student,
    } as any);
    return { ...res, isLoading: false, error: null };
  } catch (error) {
    return { ok: false, isLoading: false, error };
  }
};

export const logoutDocs = async () => {
  try {
    const res = await authControllerDocsSignOut();
    return { ...res, isLoading: false, error: null };
  } catch (error) {
    return { ok: false, isLoading: false, error };
  }
};

export const getViewableForms = async () => {
  try {
    const res = await docsControllerGetEntityForms();
    return { ...res, isLoading: false, error: null };
  } catch (error) {
    return { ok: false, isLoading: false, error };
  }
};
