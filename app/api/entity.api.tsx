import { Entity, MoaRequest, School } from "@/types/db";
import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";
import { useEntitiesControllerGetList } from "./app/api/endpoints/entities/entities";
import {
  useEntityMoaControllerGetMine,
  useEntityMoaControllerRequestNewCustom,
  useEntityMoaControllerRequestNewStandard,
} from "./app/api/endpoints/entity-moa/entity-moa";
import { useEntitySchoolsControllerGetMyPartners } from "./app/api/endpoints/entity-schools/entity-schools";

/**
 * Grabs a public list of lean entity DTOs.
 * Only names and ids are included.
 *
 * @hook
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
 * @hook
 */
export const useMoaRequests = () => {
  const { data, isFetching, isLoading } = useEntityMoaControllerGetMine();
  const createStandard = useEntityMoaControllerRequestNewStandard();
  const createCustom = useEntityMoaControllerRequestNewCustom();

  return {
    requests: (data?.requests as unknown as MoaRequest[]) ?? [],
    isLoading: isFetching || isLoading,
    createStandard: createStandard.mutateAsync,
    createCustom: createCustom.mutateAsync,
  };
};

export const usePartneredSchools = () => {
  const { data, isFetching, isLoading } = useEntitySchoolsControllerGetMyPartners();
  return {
    schools: (data?.schools as unknown as School[]) ?? [],
    isLoading: isFetching || isLoading,
  };
};
