import { Entity, MoaRequest } from "@/types/db";
import { useAuthControllerSignIn, useAuthControllerSignOut } from "./app/api/endpoints/auth/auth";
import { useEntitiesControllerGetList } from "./app/api/endpoints/entities/entities";
import {
  useEntityMoaControllerGetMine,
  useEntityMoaControllerRequestNewCustom,
  useEntityMoaControllerRequestNewStandard,
} from "./app/api/endpoints/entity-moa/entity-moa";

/**
 * Auth hook for entities.
 *
 * @hook
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
  const { data } = useEntityMoaControllerGetMine();
  const createStandard = useEntityMoaControllerRequestNewStandard();
  const createCustom = useEntityMoaControllerRequestNewCustom();

  return {
    requests: (data?.requests as unknown as MoaRequest[]) ?? [],
    createStandard: createStandard.mutateAsync,
    createCustom: createCustom.mutateAsync,
  };
};
