import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Entity, Message, MoaHistory, MoaRequest } from "@/types/db";
import { preconfiguredAxios } from "@/app/api/preconfig.axios";
import {
  useSchoolEntitiesControllerApproveRequest,
  useSchoolEntitiesControllerDenyRequest,
  useSchoolEntitiesControllerGetMyPartners,
  useSchoolEntitiesControllerGetAPartner,
  useSchoolEntitiesControllerBlacklistEntity,
} from "./app/api/endpoints/school-entities/school-entities";
import {
  useSchoolMoaControllerDeny,
  useSchoolMoaControllerGetMine,
  useSchoolMoaControllerGetOneHistory,
  useSchoolMoaControllerGetOneThread,
  useSchoolMoaControllerRespond,
  useSchoolMoaControllerSignApprovedCustom,
} from "./app/api/endpoints/school-moa/school-moa";
import { useMemo } from "react";
import { QueryClient } from "@tanstack/react-query";

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
    isLoading,
    isFetching,
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
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useSchoolMoaControllerGetMine({
    query: {
      queryKey: ["moa-requests"],
      staleTime: 5 * 60 * 1000,
    },
  });
  const denyMoaRequest = useSchoolMoaControllerDeny();
  const respondMoaRequest = useSchoolMoaControllerRespond();
  const signMoaRequest = useSchoolMoaControllerSignApprovedCustom();

  return {
    requests: (data?.requests as unknown as MoaRequest[]) ?? [],
    isLoading: isLoading || isFetching,
    deny: denyMoaRequest.mutateAsync,
    respond: respondMoaRequest.mutateAsync,
    sign: ({
      entity_id,
      request_id,
      additional_form_schema: [],
    }: {
      entity_id: string;
      request_id: string;
      additional_form_schema: any[];
    }) =>
      signMoaRequest
        .mutateAsync({
          data: {
            entity_id: "",
            request_id: "",
            additional_form_schema: [],
          },
        })
        .then(() => queryClient.invalidateQueries({ queryKey: ["moa-requests"] })),
    refetch,
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
  } = useSchoolMoaControllerGetOneThread(id, {
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
 * Returns a partner + its MOA history (entire array).
 * - history is mapped to the UI shape that CompanyHistory expects.
 * - rawHistory gives you the original parsed objects if you need them elsewhere.
 */
export const useSchoolPartner = (id?: string) => {
  // Partner details
  const {
    data: entityResp,
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

  // Partner history
  const {
    data: histEnvelopeResp,
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

  type RawEntry = {
    timestamp?: string;
    text?: string | null;
    outcome?: string | null;
    document?: string | null;
    document_effective_date?: string | null;
    document_expiry_date?: string | null;
    attachments?: string[] | null;
  };

  type UiEntry = {
    message: string;
    effective_date: string;
    expiry_date: string;
    comments: string;
    documents: string; // single URL
    timestamp: string;
  };

  const { uiHistory, rawParsed } = useMemo(() => {
    // histEnvelopeResp?.history is typically { id, school_id, entity_id, history: "[{'...'}]" }
    const histEnvelope = histEnvelopeResp?.history as MoaHistory | undefined;
    const histValue = (histEnvelope?.history as any) ?? "[]";

    let raw: RawEntry[] = [];
    try {
      if (Array.isArray(histValue)) {
        raw = histValue as RawEntry[];
      } else if (typeof histValue === "string") {
        // normalize single-quoted JSON stored in Sheets/DB to valid JSON
        const strippedOuter = histValue.trim().replace(/^"+|"+$/g, "");
        const normalized = strippedOuter.replace(/'/g, '"');
        raw = JSON.parse(normalized) as RawEntry[];
      }
    } catch (e) {
      console.warn("Failed to parse MOA history:", e, histValue);
      raw = [];
    }

    // Sort newest first using timestamp or effective_date as fallback
    raw.sort((a, b) => {
      const ad = Date.parse(a.timestamp ?? a.document_effective_date ?? "") || 0;
      const bd = Date.parse(b.timestamp ?? b.document_effective_date ?? "") || 0;
      return bd - ad;
    });

    const ui: UiEntry[] = raw.map((e) => ({
      text: (e?.text ?? "").trim() || (e?.outcome ? `Decision: ${String(e.outcome)}` : ""),
      effective_date: e?.document_effective_date ?? "",
      expiry_date: e?.document_expiry_date ?? "",
      comments: "",
      documents: e?.document ?? "",
      timestamp: e?.timestamp ?? e?.document_effective_date ?? e?.document_expiry_date ?? "",
    }));

    return { uiHistory: ui, rawParsed: raw };
  }, [histEnvelopeResp]);

  return {
    entity: (entityResp?.entity as unknown as Entity) ?? null,
    history: { ...(histEnvelopeResp as any), history: uiHistory } as MoaHistory,
    rawHistory: rawParsed as RawEntry[],

    isLoadingEntity: isFetchingEntity || isLoadingEntity,
    isLoadingHistory: isFetchingHistory || isLoadingHistory,
    error: entityError || historyError,
    refetchEntity,
    refetchHistory,
  };
};

/**
 * Returns the history about a single partner.
 *
 * @param entityId
 * @hook
 * ! to remove
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

export function useEntityRequestActions() {
  const queryClient = useQueryClient();
  const approve = useSchoolEntitiesControllerApproveRequest();
  const deny = useSchoolEntitiesControllerDenyRequest();

  return {
    approve: ({ id, reason }: { id: string; reason: string }) =>
      approve
        .mutateAsync({
          id,
          data: { reason },
        })
        .then(() => queryClient.invalidateQueries({ queryKey: ["new-entity-requests"] })),
    deny: ({ id, reason }: { id: string; reason: string }) =>
      deny
        .mutateAsync({
          id,
          data: { reason },
        })
        .then(() => queryClient.invalidateQueries({ queryKey: ["new-entity-requests"] })),
    isPending: approve.isPending || deny.isPending,
  };
}

export function useBlacklistEntity() {
  const blacklist = useSchoolEntitiesControllerBlacklistEntity();

  return {
    blacklist: (entityId: string) => blacklist.mutateAsync({ entityId }),
    isPending: blacklist.isPending,
  };
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
