import { api } from "@/lib/api";
import type { PaginatedRentLeads, RentLeadDetail } from "@/types/domain";

type RentLeadPayload = {
  code?: string | null;
  pipelineStage: string;
  status: string;
  source?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerDocument?: string | null;
  desiredRegion?: string | null;
  monthlyBudget?: number | null;
  guaranteePreference?: string | null;
  notes?: string | null;
  lossReason?: string | null;
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  propertyId?: string | null;
  tenantId?: string | null;
  responsibleUserId: string;
};

type RentLeadListQuery = {
  accessToken: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  pipelineStage?: string;
  source?: string;
  propertyId?: string;
  tenantId?: string;
  responsibleUserId?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const rentsService = {
  async list(query: RentLeadListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedRentLeads>("/rent-leads", {
      ...authHeader(accessToken),
      params,
    });

    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<RentLeadDetail>(
      `/rent-leads/${id}`,
      authHeader(accessToken),
    );
    return data;
  },

  async create(accessToken: string, payload: RentLeadPayload) {
    const { data } = await api.post("/rent-leads", payload, authHeader(accessToken));
    return data;
  },

  async update(accessToken: string, id: string, payload: RentLeadPayload) {
    const { data } = await api.patch(
      `/rent-leads/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};
