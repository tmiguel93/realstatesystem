import { api } from "@/lib/api";
import type { OwnerDetail, PaginatedOwners } from "@/types/domain";

type OwnerPayload = {
  personType: string;
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
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccount?: string | null;
  pixKey?: string | null;
  notes?: string | null;
  isActive: boolean;
};

type OwnerListQuery = {
  accessToken: string;
  page: number;
  pageSize: number;
  search?: string;
  isActive?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const ownersService = {
  async list(query: OwnerListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedOwners>("/owners", {
      ...authHeader(accessToken),
      params,
    });

    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<OwnerDetail>(
      `/owners/${id}`,
      authHeader(accessToken),
    );

    return data;
  },

  async create(accessToken: string, payload: OwnerPayload) {
    const { data } = await api.post("/owners", payload, authHeader(accessToken));
    return data;
  },

  async update(accessToken: string, id: string, payload: OwnerPayload) {
    const { data } = await api.patch(
      `/owners/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};

