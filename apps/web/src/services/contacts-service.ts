import { api } from "@/lib/api";
import type { PaginatedContacts } from "@/types/domain";

export type ContactPayload = {
  personType: string;
  fullName: string;
  document?: string | null;
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
  notes?: string | null;
  isActive: boolean;
  roles: string[];
};

type ContactListQuery = {
  accessToken: string;
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  isActive?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const contactsService = {
  async list(query: ContactListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedContacts>("/contacts", {
      ...authHeader(accessToken),
      params,
    });

    return data;
  },

  async create(accessToken: string, payload: ContactPayload) {
    const { data } = await api.post(
      "/contacts",
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async update(accessToken: string, id: string, payload: ContactPayload) {
    const { data } = await api.patch(
      `/contacts/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};
