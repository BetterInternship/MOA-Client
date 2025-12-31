import { docsLinkLoginControllerLinkLogin } from "./app/api/endpoints/docs-link-login/docs-link-login";
import { docsControllerGetEntityForms } from "./app/api/endpoints/docs/docs";
import {
  authControllerSignatoryLoginRequest,
  authControllerSignatoryLoginVerify,
  authControllerSignatorySelf,
  authControllerSignatorySignOut,
} from "./app/api/endpoints/auth/auth";

export const requestLoginOtp = async (email: string) => {
  return await authControllerSignatoryLoginRequest({ email });
};

export const verifyLoginOtp = async (email: string, otp: string) => {
  return await authControllerSignatoryLoginVerify({ email, code: otp });
};

export const getSignatorySelf = async () => {
  return await authControllerSignatorySelf();
};

export const autoLogin = async (params: {
  email: string;
  id?: string;
  name?: string;
  form?: string;
  aud: string;
  pending?: string;
  student?: string;
}) => {
  const { id, email, name, form, aud, pending, student } = params;
  return await docsLinkLoginControllerLinkLogin({
    id: id!,
    email,
    name: name!,
    form: form!,
    for: aud,
    pending: pending!,
    student: student!,
  });
};

export const logoutSignatory = async () => {
  return await authControllerSignatorySignOut();
};

export const getViewableForms = async () => {
  return await docsControllerGetEntityForms();
};
