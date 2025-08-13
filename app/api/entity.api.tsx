import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";
import {
  useEntityMoaControllerGetMine,
  useEntityMoaControllerRequestNew,
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
  const create = useEntityMoaControllerRequestNew();

  return {
    requests: requests.data?.data?.requests,
    create: create.mutateAsync,
  };
};
