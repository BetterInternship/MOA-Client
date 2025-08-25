import { useMutation } from "@tanstack/react-query";
import { Entity, MoaRequest } from "@/types/db";
import { preconfiguredAxios } from "@/app/api/preconfig.axios";
import {
  useSchoolEntitiesControllerApproveRequest,
  useSchoolEntitiesControllerDenyRequest,
  useSchoolEntitiesControllerGetMyPartners,
  useSchoolEntitiesControllerGetAPartner,
} from "./app/api/endpoints/school-entities/school-entities";
import {
  useSchoolMoaControllerApprove,
  useSchoolMoaControllerDeny,
  useSchoolMoaControllerGetMine,
  useSchoolMoaControllerGetOneHistory,
} from "./app/api/endpoints/school-moa/school-moa";

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

/**
 * Returns a schools partner entities.
 *
 * @param opts
 * @hook
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
 * @hook
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

/**
 * Returns the history about a single partner.
 *
 * @param entityId
 * @hook
 */
export const useSchoolMoaHistory = (entityId?: string) => {
  const q = useSchoolMoaControllerGetOneHistory(entityId, {
    query: { enabled: !!entityId },
  });

  return {
    // Orval base response is often { success, data: { history } }
    items: (q.data?.history?.history ?? []) as any[],
    isLoading: q.isLoading || q.isFetching,
    isError: !!q.error,
    refetch: q.refetch,
  };
};

export type CreateCompanyPayload = {
  display_name: string;
  legal_name: string;
  office_location: string;
  website: string;
  industry: string;
  description: string;
  contact: { name: string; phone: string; email: string };
  profile: {
    acceptsNonUniversityInterns: boolean;
    ongoingMoaWithDlsu: boolean;
  };
  type?: string;
};

type CreateCompanyResponse =
  | { success?: boolean; data?: { entity?: Entity; id?: string } }
  | { success?: boolean; entity?: Entity; id?: string };

export const useCreateCompany = () => {
  const client = preconfiguredAxios; // MUST be an instance: axios.create({...})

  return useMutation<string, Error, CreateCompanyPayload>({
    mutationKey: ["create-company"],
    mutationFn: async (payload) => {
      const res = await client.post<CreateCompanyResponse>("/api/school/entities", payload);
      const body = res?.data ?? ({} as any);

      const id =
        body?.data?.entity?.id ?? body?.data?.id ?? (body as any)?.entity?.id ?? (body as any)?.id;

      if (!id) {
        throw new Error("Create company: missing id in response");
      }
      return id;
    },
  });
};
