import { api } from "@/lib/api";
import type { PaginatedSaleLeads, SaleLeadDetail } from "@/types/domain";

type SaleLeadPayload = {
  code?: string | null;
  pipelineStage: string;
  status: string;
  source?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerDocument?: string | null;
  desiredRegion?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  notes?: string | null;
  lossReason?: string | null;
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  propertyId?: string | null;
  responsibleUserId: string;
};

type SaleLeadListQuery = {
  accessToken: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  pipelineStage?: string;
  source?: string;
  propertyId?: string;
  responsibleUserId?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const salesService = {
  async list(query: SaleLeadListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedSaleLeads>("/sale-leads", {
      ...authHeader(accessToken),
      params,
    });

    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<SaleLeadDetail>(
      `/sale-leads/${id}`,
      authHeader(accessToken),
    );
    return data;
  },

  async create(accessToken: string, payload: SaleLeadPayload) {
    const { data } = await api.post("/sale-leads", payload, authHeader(accessToken));
    return data;
  },

  async update(accessToken: string, id: string, payload: SaleLeadPayload) {
    const { data } = await api.patch(
      `/sale-leads/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};
