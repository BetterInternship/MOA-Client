import {
  useAuthControllerSchoolSignIn,
  useAuthControllerSchoolSignOut,
} from "./app/api/endpoints/auth/auth";
import {
  useSchoolEntitiesControllerApproveRequest,
  useSchoolEntitiesControllerDenyRequest,
  useSchoolEntitiesControllerGetMyPartners,
  useSchoolEntitiesControllerGetMyRequests,
} from "./app/api/endpoints/school-entities/school-entities";
import {
  useSchoolMoaControllerApprove,
  useSchoolMoaControllerDeny,
  useSchoolMoaControllerGetMine,
} from "./app/api/endpoints/school-moa/school-moa";

export const useAuth = () => {
  const signIn = useAuthControllerSchoolSignIn();
  const signOut = useAuthControllerSchoolSignOut();

  return {
    signIn: signIn.mutateAsync,
    signOut: signOut.mutateAsync,
  };
};

export const useEntities = async (opts?: { offset?: number; limit?: number }) => {
  const entities = useSchoolEntitiesControllerGetMyPartners({
    offset: opts?.offset ?? 0,
    limit: opts?.limit ?? 100,
  });
  const requests = useSchoolEntitiesControllerGetMyRequests();
  const approveRequest = useSchoolEntitiesControllerApproveRequest();

  return {
    entities: entities.data,
    isFetchingEntities: entities.isFetching,
    approveRequest: approveRequest.mutateAsync,
  };
};

export const useMoaRequests = () => {
  const requests = useSchoolMoaControllerGetMine();
  const approve = useSchoolMoaControllerApprove();
  const deny = useSchoolMoaControllerDeny();

  return {
    requests: requests.data,
    approve: approve.mutateAsync,
    deny: deny.mutateAsync,
  };
};

export const useNewEntityRequests = () => {
  const requests = useSchoolEntitiesControllerGetMyRequests();
  const approve = useSchoolEntitiesControllerApproveRequest();
  const deny = useSchoolEntitiesControllerDenyRequest();

  return {
    requests: requests.data,
    approve: approve.mutateAsync,
    deny: deny.mutateAsync,
  };
};
