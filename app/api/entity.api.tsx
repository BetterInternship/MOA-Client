import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";
import { useSchoolMoaControllerRequestNew } from "./app/api/endpoints/school-moa/school-moa";

export const useAuth = () => {
  const signIn = useAuthControllerSignIn();
  const signOut = useAuthControllerSignOut();

  return {
    signIn: signIn.mutateAsync,
    signOut: signOut.mutateAsync,
  };
};

export const useMoaRequests = () => {
  const moaRequests = useSchoolMoaControllerRequestNew();

  return {
    create: moaRequests.mutateAsync,
  };
};
