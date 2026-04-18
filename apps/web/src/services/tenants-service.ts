import { api } from "@/lib/api";
import type { PaginatedTenants, TenantDetail } from "@/types/domain";

type TenantPayload = {
  fullName: string;
  document: string;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  zipCode?: string | null;
  state?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  scoreStatus: string;
  scoreValue?: number | null;
  notes?: string | null;
  isActive: boolean;
};

type TenantListQuery = {
  accessToken: string;
  page: number;
  pageSize: number;
  search?: string;
  isActive?: string;
  scoreStatus?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const tenantsService = {
  async list(query: TenantListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedTenants>("/tenants", {
      ...authHeader(accessToken),
      params,
    });

    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<TenantDetail>(
      `/tenants/${id}`,
      authHeader(accessToken),
    );

    return data;
  },

  async create(accessToken: string, payload: TenantPayload) {
    const { data } = await api.post("/tenants", payload, authHeader(accessToken));
    return data;
  },

  async update(accessToken: string, id: string, payload: TenantPayload) {
    const { data } = await api.patch(
      `/tenants/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};

