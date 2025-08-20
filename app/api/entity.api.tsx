import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";
import {
  useEntityMoaControllerGetMine,
  useEntityMoaControllerRequestNewCustom,
  useEntityMoaControllerRequestNewStandard,
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

  // robust unwrap (supports {data:{...}} or flat)
  const ax = requests.data as any;
  const root = ax?.data ?? ax;

  return {
    requests: root?.requests ?? root?.data?.requests ?? [],
    createTemplated: createTemplated.mutateAsync,
    createCustom: createCustom.mutateAsync,
  };
};

/** List the school's partner entities */
export const useSchoolPartners = (opts?: { offset?: number; limit?: number }) => {
  const { offset = 0, limit = 100 } = opts ?? {};
  const q = useSchoolEntitiesControllerGetMyPartners({ offset, limit });

  // axios may return {data: <payload>} or already the payload (depending on orval config)
  const ax = q.data as any;
  const root = ax?.data ?? ax;

  return {
    partners: root?.entities ?? root?.data?.entities ?? [],
    isLoading: q.isLoading || q.isFetching,
    isError: !!q.error,
    refetch: q.refetch,
  };
};

/** Get one partner entity’s full details (when a row is selected) */
export const useSchoolPartner = (id?: string) => {
  const q = useSchoolEntitiesControllerGetAPartner(id, { query: { enabled: !!id } });

  const ax = q.data as any;
  const root = ax?.data ?? ax;

  return {
    partner: root?.entity ?? root?.data?.entity ?? null,
    isLoading: q.isFetching || q.isLoading,
    isError: !!q.error,
    refetch: q.refetch,
  };
};
