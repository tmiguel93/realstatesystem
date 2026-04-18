import { api } from "@/lib/api";
import type { PaginatedVisits, VisitDetail } from "@/types/domain";

type VisitPayload = {
  propertyId: string;
  saleLeadId?: string | null;
  rentLeadId?: string | null;
  brokerUserId: string;
  scheduledAt: string;
  status: string;
  completedAt?: string | null;
  outcome?: string | null;
  notes?: string | null;
  resultSummary?: string | null;
};

type VisitsListQuery = {
  accessToken: string;
  page?: number;
  pageSize?: number;
  status?: string;
  propertyId?: string;
  brokerUserId?: string;
  dateFrom?: string;
  dateTo?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const visitsService = {
  async list(query: VisitsListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedVisits>("/visits", {
      ...authHeader(accessToken),
      params,
    });
    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<VisitDetail>(
      `/visits/${id}`,
      authHeader(accessToken),
    );
    return data;
  },

  async create(accessToken: string, payload: VisitPayload) {
    const { data } = await api.post("/visits", payload, authHeader(accessToken));
    return data;
  },

  async update(accessToken: string, id: string, payload: VisitPayload) {
    const { data } = await api.patch(
      `/visits/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};
