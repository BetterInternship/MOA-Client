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
import { useAuthPublicRegisterCompany } from "./app/api/endpoints/auth/auth";
import { keepPreviousData, useMutation } from "@tanstack/react-query";
import { preconfiguredAxiosFunction } from "@/app/api/preconfig.axios";
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
      // placeholderData: keepPreviousData,
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

type PublicRegisterPayload = {
  display_name: string;
  legal_name: string;
  office_location: string;
  industry: string;
  contact: { name: string; email: string; phone: string };
  profile: { acceptsNonUniversityInterns: boolean; ongoingMoaWithDlsu: boolean };
  password?: string;
  type?: string;
};

export function buildCompanyRegisterPayload(form: FormData): PublicRegisterPayload {
  const display = String(form.get("companyName") || "").trim();
  const legal = String(form.get("legalName") || form.get("legalIdentifier") || "").trim();
  const office = String(form.get("address") || "").trim();
  const industry = String(form.get("industry") || "").trim();

  const contactName = String(form.get("contactName") || "").trim();
  const contactEmail = String(form.get("contactEmail") || "").trim();
  const contactPhone = String(form.get("contactPhone") || "").trim();
  const passwordRaw = String(form.get("password") || "").trim();

  if (!legal) throw new Error("Legal name is required.");

  return {
    display_name: display,
    legal_name: legal, // ✅ exact key the backend expects
    office_location: office,
    industry,
    contact: { name: contactName, email: contactEmail, phone: contactPhone },
    profile: {
      acceptsNonUniversityInterns: true,
      ongoingMoaWithDlsu: false,
    },
    ...(passwordRaw ? { password: passwordRaw } : {}),
    type: "org",
  };
}

/** Manual mutation that always sends JSON body */
export function usePublicCompanyRegister() {
  const m = useMutation({
    mutationFn: async (payload: PublicRegisterPayload) => {
      return preconfiguredAxiosFunction({
        method: "POST",
        url: "/api/auth/public/register-company",
        data: payload,
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  return {
    register: m.mutateAsync,
    isPending: m.isPending,
    error: m.error,
    reset: m.reset,
  };
}
