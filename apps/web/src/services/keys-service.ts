import { api } from "@/lib/api";
import type { PaginatedPropertyKeys, PropertyKeyDetail } from "@/types/domain";

type KeyPayload = {
  propertyId: string;
  identifier: string;
  description?: string | null;
  isCopy: boolean;
};

type KeyCheckoutPayload = {
  holderType: string;
  holderName: string;
  holderDocument?: string | null;
  checkoutAt?: string | null;
  expectedReturnAt?: string | null;
  notes?: string | null;
  overrideReason?: string | null;
};

type KeyCheckinPayload = {
  returnedAt?: string | null;
  notes?: string | null;
};

type KeyStatusPayload = {
  status: string;
  notes?: string | null;
  overrideReason?: string | null;
};

type KeysListQuery = {
  accessToken: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  propertyId?: string;
  onlyOverdue?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const keysService = {
  async list(query: KeysListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedPropertyKeys>("/keys", {
      ...authHeader(accessToken),
      params,
    });
    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<PropertyKeyDetail>(
      `/keys/${id}`,
      authHeader(accessToken),
    );
    return data;
  },

  async create(accessToken: string, payload: KeyPayload) {
    const { data } = await api.post("/keys", payload, authHeader(accessToken));
    return data;
  },

  async checkout(accessToken: string, id: string, payload: KeyCheckoutPayload) {
    const { data } = await api.post(
      `/keys/${id}/checkout`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async checkin(accessToken: string, id: string, payload: KeyCheckinPayload) {
    const { data } = await api.post(
      `/keys/${id}/checkin`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async changeStatus(accessToken: string, id: string, payload: KeyStatusPayload) {
    const { data } = await api.post(
      `/keys/${id}/status`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};
