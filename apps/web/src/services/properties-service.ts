import { api } from "@/lib/api";
import type { PaginatedProperties, PropertyDetail } from "@/types/domain";

type PropertyPayload = {
  code?: string | null;
  title: string;
  type: string;
  purpose: string;
  status: string;
  commercialSituation: string;
  ownerId: string;
  zipCode: string;
  state: string;
  city: string;
  district: string;
  street: string;
  streetNumber: string;
  complement?: string | null;
  description?: string | null;
  internalNotes?: string | null;
  salePrice?: number | null;
  rentPrice?: number | null;
  condoFee?: number | null;
  iptu?: number | null;
  areaTotal?: number | null;
  areaBuilt?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  suites?: number | null;
  parkingSpots?: number | null;
  floor?: number | null;
  furnished: boolean;
  acceptsPet?: boolean | null;
  isPublished: boolean;
};

type PropertyListQuery = {
  accessToken: string;
  page: number;
  pageSize: number;
  search?: string;
  ownerId?: string;
  purpose?: string;
  status?: string;
  city?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const propertiesService = {
  async list(query: PropertyListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedProperties>("/properties", {
      ...authHeader(accessToken),
      params,
    });

    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<PropertyDetail>(
      `/properties/${id}`,
      authHeader(accessToken),
    );

    return data;
  },

  async create(accessToken: string, payload: PropertyPayload) {
    const { data } = await api.post(
      "/properties",
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async update(accessToken: string, id: string, payload: PropertyPayload) {
    const { data } = await api.patch(
      `/properties/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },
};

