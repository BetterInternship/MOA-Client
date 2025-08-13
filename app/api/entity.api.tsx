import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";
import {
  useEntityMoaControllerGetMine,
  useEntityMoaControllerRequestNewCustom,
  useEntityMoaControllerRequestNewTemplated,
} from "./app/api/endpoints/entity-moa/entity-moa";

export const useAuth = () => {
  const signIn = useAuthControllerSignIn();
  const signOut = useAuthControllerSignOut();

  return {
    signIn: signIn.mutateAsync,
    signOut: signOut.mutateAsync,
  };
};

export const useMoaRequests = () => {
  const requests = useEntityMoaControllerGetMine();
  const createTemplated = useEntityMoaControllerRequestNewTemplated();
  const createCustom = useEntityMoaControllerRequestNewCustom();

  return {
    requests: requests.data?.data?.requests,
    createTemplated: createTemplated.mutateAsync,
    createCustom: createCustom.mutateAsync,
  };
};
