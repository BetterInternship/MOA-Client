import { Entity, MoaRequest } from "@/types/db";
import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";
import { useEntitiesControllerGetList } from "./app/api/endpoints/entities/entities";
import {
  useEntityMoaControllerGetMine,
  useEntityMoaControllerRequestNewCustom,
  useEntityMoaControllerRequestNewStandard,
} from "./app/api/endpoints/entity-moa/entity-moa";
import {
  useSchoolEntitiesControllerGetMyPartners,
  useSchoolEntitiesControllerGetAPartner,
} from "./app/api/endpoints/school-entities/school-entities";

/**
 * Auth hook for entities.
 *
 * @hook
 * @returns
 */
export const useAuth = () => {
  const signIn = useAuthControllerSignIn();
  const signOut = useAuthControllerSignOut();

  return {
    signIn: signIn.mutateAsync,
    signOut: signOut.mutateAsync,
  };
};

/**
 * Grabs a public list of lean entity DTOs.
 * Only names and ids are included.
 *
 * @returns
 */
export const usePublicEntityList = () => {
  const { data } = useEntitiesControllerGetList();
  return {
    entities: (data?.entities as unknown as Entity[]) ?? [],
  };
};

/**
 * Grabs moa requests tied to an entity.
 *
 * @returns
 */
export const useMoaRequests = () => {
  const { data } = useEntityMoaControllerGetMine();
  const createStandard = useEntityMoaControllerRequestNewStandard();
  const createCustom = useEntityMoaControllerRequestNewCustom();

  return {
    requests: (data?.requests as unknown as MoaRequest[]) ?? [],
    createStandard: createStandard.mutateAsync,
    createCustom: createCustom.mutateAsync,
  };
};

/**
 * Returns a schools partner entities.
 *
 * @param opts
 * @returns
 */
export const useSchoolPartners = (opts?: { offset?: number; limit?: number }) => {
  const { offset = 0, limit = 100 } = opts ?? {};
  const { data, isLoading, isFetching, error, refetch } = useSchoolEntitiesControllerGetMyPartners({
    offset,
    limit,
  });

  return {
    partners: (data?.entities as unknown as Entity[]) ?? [],
    isLoading: isLoading || isFetching,
    error: error,
    refetch: refetch,
  };
};

/**
 * Returns the information about a single partner.
 *
 * @param id
 * @returns
 */
export const useSchoolPartner = (id?: string) => {
  const { data, isFetching, isLoading, error, refetch } = useSchoolEntitiesControllerGetAPartner(
    id,
    { query: { enabled: !!id } }
  );

  return {
    partner: (data?.entity as unknown as Entity) ?? null,
    isLoading: isFetching || isLoading,
    error: error,
    refetch: refetch,
  };
};
