import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";

export const useAuthApi = () => {
  const signIn = useAuthControllerSignIn();
  const signOut = useAuthControllerSignOut();

  return {
    signIn: signIn.mutateAsync,
    signOut: signOut.mutateAsync,
  };
};
