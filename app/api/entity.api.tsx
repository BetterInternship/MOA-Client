import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";
import {
  useEntityMoaControllerGetMine,
  useEntityMoaControllerRequestNewCustom,
  useEntityMoaControllerRequestNewStandard,
  // useEntityMoaControllerRequestNewTemplated,
} from "./app/api/endpoints/entity-moa/entity-moa";

import {
  useSchoolEntitiesControllerGetMyPartners,
  useSchoolEntitiesControllerGetAPartner,
} from "./app/api/endpoints/school-entities/school-entities";

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
  const createTemplated = useEntityMoaControllerRequestNewStandard();
  const createCustom = useEntityMoaControllerRequestNewCustom();

  return {
    requests: requests.data?.data?.requests,
    createTemplated: createTemplated.mutateAsync,
    createCustom: createCustom.mutateAsync,
  };
};

/** List the school's partner entities */
export const useSchoolPartners = (opts?: { offset?: number; limit?: number }) => {
  const { offset = 0, limit = 100 } = opts ?? {};
  const q = useSchoolEntitiesControllerGetMyPartners({ offset, limit });

  return {
    partners: q.data?.data?.entities ?? [], // BaseResponse -> { data: { entities: [...] } }
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
};

/** Get one partner entity’s full details (when a row is selected) */
export const useSchoolPartner = (id?: string) => {
  const q = useSchoolEntitiesControllerGetAPartner(id, {
    query: { enabled: !!id },
  });

  return {
    partner: q.data?.data?.entity ?? null,
    isLoading: q.isFetching,
    isError: !!q.error,
    refetch: q.refetch,
  };
};
