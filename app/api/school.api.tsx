import { useQuery, useMutation } from "@tanstack/react-query";
import { Entity, MoaHistory, MoaRequest } from "@/types/db";
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
import { useMemo } from "react";

/**
 * Gives information about school partners.
 *
 * @param opts
 * @hook
 */
export const useEntities = (opts?: { offset?: number; limit?: number }) => {
  const { data, isFetching, isLoading, error, refetch } = useSchoolEntitiesControllerGetMyPartners(
    {
      offset: opts?.offset ?? 0,
      limit: opts?.limit ?? 100,
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
  const { data, isLoading, isFetching } = useSchoolMoaControllerGetMine();
  const approveMoaRequest = useSchoolMoaControllerApprove();
  const denyMoaRequest = useSchoolMoaControllerDeny();

  return {
    requests: (data?.requests as unknown as MoaRequest[]) ?? [],
    isLoading: isLoading || isFetching,
    approve: approveMoaRequest.mutateAsync,
    deny: denyMoaRequest.mutateAsync,
  };
};

/**
 *
 */
export const useThreads = () => {};

/**
 * Returns a school's partner entities.
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
  // Grab partner details
  const {
    data: entity,
    isFetching: isFetchingEntity,
    isLoading: isLoadingEntity,
    error: entityError,
    refetch: refetchEntity,
  } = useSchoolEntitiesControllerGetAPartner(id, {
    query: {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  });

  // Grab partner history
  const {
    data: rawHistory,
    isFetching: isFetchingHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useSchoolMoaControllerGetOneHistory(id, {
    query: {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  });

  // Ensure that the JSON is parsed
  const history = useMemo(() => {
    const hMoa = rawHistory?.history as MoaHistory;
    const hJson = hMoa?.history ?? "[{}]";
    console.log(hJson);
    return {
      ...rawHistory,
      history:
        typeof hJson === "string"
          ? JSON.parse(hJson.replaceAll('"', '\\"').replaceAll("'", '"'))
          : hJson,
    } as unknown as MoaHistory;
  }, [rawHistory]);

  return {
    entity: (entity?.entity as unknown as Entity) ?? null,
    history: history as MoaHistory,
    isLoadingEntity: isFetchingEntity || isLoadingEntity,
    isLoadingHistory: isFetchingHistory || isLoadingHistory,
    error: entityError || historyError,
    refetchEntity: refetchEntity,
    refetchHistory: refetchHistory,
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
      select: (res) => (res?.history?.history ?? []) as any[],
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
  school_id: string;
  timestamp?: string;
  outcome?: "approved" | "denied" | "pending" | "conversing" | null;
  processed_by_account_id?: string | null;
  processed_date?: string | null;
};

type RequestsListResponse = { requests: CompanyRequest[] };

// --- list all company requests for current school ---
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
    staleTime: 60_000, // cache 1 minute
    refetchOnWindowFocus: false, // don’t refetch on tab focus
  });
}

// --- single request by entityId (backend returns {requests:[...]}) ---
export function useSchoolCompanyRequest(entityId?: string) {
  return useQuery({
    enabled: !!entityId,
    queryKey: ["schools", "company-request", entityId],
    queryFn: async () => {
      const res = await preconfiguredAxios.get<{ requests: CompanyRequest[] }>(
        `/api/schools/company-requests/${entityId}`
      );
      return res.data?.requests?.[0] ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export const useEntityRequestActions = () => {
  const approve = useSchoolEntitiesControllerApproveRequest();
  const deny = useSchoolEntitiesControllerDenyRequest();

  return { approve, deny, isPending: approve.isPending || deny.isPending };
};

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

/* ---------------- Schools: Stats (counts) ---------------- */
/** Counts: active MOAs, ending MOA requests, active entities, registered entities */
export function useSchoolStats() {
  return useQuery({
    queryKey: ["schools", "stats"],
    queryFn: async () => {
      const [activeMoas, pendingMoas, activeEntities, registeredEntities] = await Promise.all([
        preconfiguredAxios.get<CountResponse>("/api/schools/stats/active-moas"),
        preconfiguredAxios.get<CountResponse>("/api/schools/stats/pending-moas"),
        preconfiguredAxios.get<CountResponse>("/api/schools/stats/active-entities"),
        preconfiguredAxios.get<CountResponse>("/api/schools/stats/registered-entities"),
      ]);
      return {
        activeMoas: activeMoas.data?.count ?? 0,
        pendingMoas: pendingMoas.data?.count ?? 0,
        activeEntities: activeEntities.data?.count ?? 0,
        registeredEntities: registeredEntities.data?.count ?? 0,
      };
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}
