import { Entity, MoaRequest } from "@/types/db";
import {
  useAuthControllerSchoolSignIn,
  useAuthControllerSchoolSignOut,
} from "./app/api/endpoints/auth/auth";
import {
  useSchoolEntitiesControllerApproveRequest,
  useSchoolEntitiesControllerDenyRequest,
  useSchoolEntitiesControllerGetMyPartners,
} from "./app/api/endpoints/school-entities/school-entities";
import {
  useSchoolMoaControllerApprove,
  useSchoolMoaControllerDeny,
  useSchoolMoaControllerGetMine,
} from "./app/api/endpoints/school-moa/school-moa";

/**
 * Auth hook for schools.
 *
 * @hook
 */
export const useAuth = () => {
  const signIn = useAuthControllerSchoolSignIn();
  const signOut = useAuthControllerSchoolSignOut();

  return {
    signIn: signIn.mutateAsync,
    signOut: signOut.mutateAsync,
  };
};

/**
 * Gives information about school partners.
 *
 * @param opts
 * @hook
 */
export const useEntities = async (opts?: { offset?: number; limit?: number }) => {
  const { data, isFetching, isLoading, error, refetch } = useSchoolEntitiesControllerGetMyPartners({
    offset: opts?.offset ?? 0,
    limit: opts?.limit ?? 100,
  });
  const approveNewEntityRequest = useSchoolEntitiesControllerApproveRequest();
  const denyNewEntityRequest = useSchoolEntitiesControllerDenyRequest();

  return {
    entities: (data?.entities as unknown as Entity[]) ?? [],
    isLoading: isFetching || isLoading,
    error,
    refetch,
    approve: approveNewEntityRequest.mutateAsync,
    deny: denyNewEntityRequest.mutateAsync,
  };
};

/**
 * Gives information about a school's moa requests.
 *
 * @hook
 */
export const useMoaRequests = () => {
  const { data } = useSchoolMoaControllerGetMine();
  const approveMoaRequest = useSchoolMoaControllerApprove();
  const denyMoaRequest = useSchoolMoaControllerDeny();

  return {
    requests: (data?.requests as unknown as MoaRequest) ?? [],
    approve: approveMoaRequest.mutateAsync,
    deny: denyMoaRequest.mutateAsync,
  };
};
