import { useQuery, useMutation, UseInfiniteQuery } from "@tanstack/react-query";
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
  const { data, isLoading, isFetching, error, refetch } = useSchoolEntitiesControllerGetMyPartners(
    {
      offset,
      limit,
    },
    {
      query: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    }
  );

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
    {
      query: {
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
        keepPreviousData: true,
      },
    }
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
    query: {
      enabled: !!entityId,
      staleTime: 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      keepPreviousData: true,
      select: (res) => ((res?.history?.history ?? []) as any[]),
    },
  });

  return {
    items: q.data ?? [],
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

export type CompanyRequest = {
  id: string;
  entity_id: string;
  timestamp?: string;
  school_id: string;
  outcome?: "approved" | "denied" | "pending" | "conversing" | null;
  processed_by_account_id?: string | null;
  processed_date?: string | null;
  // add thread_id, etc. if you need them
};

export type CountResponse = { count: number };

type RequestsListResponse = { requests: CompanyRequest[] };
type ActiveMoasListResponse = {
  // whatever your API returns; here we assume a list of linked entities
  entities?: Entity[]; // if controller returns { entities }
  links?: Array<{ entity_id: string }>; // if controller returns links instead
};

/* ---------------- Schools: Requests ---------------- */

/** List all company requests for the current school (from cookie) */
export function useSchoolCompanyRequests(opts?: { offset?: number; limit?: number }) {
  const { offset = 0, limit = 50 } = opts ?? {};
  return useQuery({
    queryKey: ["schools", "company-requests", { offset, limit }],
    queryFn: async () => {
      const res = await preconfiguredAxios.get<RequestsListResponse>(
        "/api/schools/company-requests",
        { params: { offset, limit } }
      );
      return res.data?.requests ?? [];
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

/** Get a specific company request for the current school by entityId */
export function useSchoolCompanyRequest(entityId?: string) {
  return useQuery({
    enabled: !!entityId,
    queryKey: ["schools", "company-request", entityId],
    queryFn: async () => {
      const res = await preconfiguredAxios.get<{ request: CompanyRequest }>(
        `/api/schools/company-requests/${entityId}`
      );
      return res.data?.request ?? null;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

/* ---------------- Schools: Active MOAs (approved links) ---------------- */

/** Retrieve list of active MOAs (approved) for current school */
export function useSchoolActiveMoas(opts?: { offset?: number; limit?: number }) {
  const { offset = 0, limit = 200 } = opts ?? {};
  return useQuery({
    queryKey: ["schools", "active-moas", { offset, limit }],
    queryFn: async () => {
      const res = await preconfiguredAxios.get<ActiveMoasListResponse>("/api/schools/active-moas", {
        params: { offset, limit },
      });
      // normalize to an array of Entity if available; else fall back to links
      const entities = res.data?.entities ?? [];
      return entities;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

/** Convenience count derived from list (pull a big page and count) */
export function useSchoolActiveMoasCount() {
  const q = useSchoolActiveMoas({ offset: 0, limit: 500 }); // adjust if needed
  const count = q.data?.length ?? 0;
  return { ...q, count };
}

/* ---------------- Schools: Stats (counts) ---------------- */

type RequestsListResponse = { requests: CompanyRequest[] };
type CountResponse = { count: number };
type ActiveMoasListResponse = { entities?: any[] }; // if your API returns entities

/** Counts: pending MOA requests, active entities, registered entities */
export function useSchoolStats() {
  return useQuery({
    queryKey: ["schools", "stats"],
    queryFn: async () => {
      const [pendingMoas, activeEntities, registeredEntities] = await Promise.all([
        preconfiguredAxios.get<CountResponse>("/api/schools/stats/pending-moas"),
        preconfiguredAxios.get<CountResponse>("/api/schools/stats/active-entities"),
        preconfiguredAxios.get<CountResponse>("/api/schools/stats/registered-entities"),
      ]);
      return {
        pendingMoas: pendingMoas.data?.count ?? 0,
        activeEntities: activeEntities.data?.count ?? 0,
        registeredEntities: registeredEntities.data?.count ?? 0,
      };
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}
