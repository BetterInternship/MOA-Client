import {
  authControllerDocsLoginRequest,
  authControllerDocsLoginVerify,
  authControllerDocsSelf,
} from "./app/api/endpoints/auth/auth";

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
    // res shape: { ok: boolean, profile?: { email: string, name?: string } }
    return { ...res, isLoading: false, error: null };
  } catch (error) {
    return { ok: false, profile: null, isLoading: false, error };
  }
};
