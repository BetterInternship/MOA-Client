import { Entity, Message, MoaRequest, School } from "@/types/db";
import { useEntitiesControllerGetList } from "./app/api/endpoints/entities/entities";
import {
  useEntityMoaControllerGetMine,
  useEntityMoaControllerGetOneThread,
  useEntityMoaControllerRequestNewCustom,
  useEntityMoaControllerRequestNewStandard,
  useEntityMoaControllerRespond,
} from "./app/api/endpoints/entity-moa/entity-moa";
import { useEntitySchoolsControllerGetMyPartners } from "./app/api/endpoints/entity-schools/entity-schools";
import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";

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
  const { data, isFetching, isLoading } = useEntityMoaControllerGetMine({
    query: {
      queryKey: ["moa-requests"],
      staleTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
    },
  });
  const createStandard = useEntityMoaControllerRequestNewStandard();
  const createCustom = useEntityMoaControllerRequestNewCustom();
  const respond = useEntityMoaControllerRespond();

  return {
    requests: (data?.requests as unknown as MoaRequest[]) ?? [],
    isLoading: isFetching || isLoading,
    createStandard: createStandard.mutateAsync,
    createCustom: createCustom.mutateAsync,
    respond: respond.mutateAsync,
  };
};

/**
 * Gets all the messages associated with a thread for a moa request.
 *
 * @hook
 */
export const useRequestThread = (id?: string | null) => {
  const {
    data: rawMessages,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useEntityMoaControllerGetOneThread(id, {
    query: {
      enabled: !!id,
      placeholderData: keepPreviousData,
    },
  });
  const messages = useMemo(() => rawMessages?.messages as unknown as Message[], [rawMessages]);

  return {
    messages:
      messages?.map((rawMessage) => {
        const rawAtts = rawMessage.attachments;
        return {
          ...rawMessage,
          attachments: (typeof rawAtts === "string" ? JSON.parse(rawAtts) : rawAtts) ?? [],
        };
      }) ?? [],
    isLoading,
    isFetching,
    refetch,
    error,
  };
};

/**
 * Gets a list of schools the uni partnered with.
 */
export const usePartneredSchools = () => {
  const { data, isFetching, isLoading } = useEntitySchoolsControllerGetMyPartners();
  return {
    schools: (data?.schools as unknown as School[]) ?? [],
    isLoading: isFetching || isLoading,
  };
};
