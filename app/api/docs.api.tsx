import { docsControllerGetEntityForms } from "./app/api/endpoints/docs/docs";
import { signatoryMagicLinkControllerMagicLinkLogin } from "./app/api/endpoints/signatory-magic-link/signatory-magic-link";
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

export const magicLinkLogin = async (params: { id: string; hash: string; redirect: string }) => {
  return await signatoryMagicLinkControllerMagicLinkLogin(params);
};

export const logoutSignatory = async () => {
  return await authControllerSignatorySignOut();
};

export const getViewableForms = async () => {
  // ! refactor, this route doesn't exist anymore
  return await docsControllerGetEntityForms();
};
