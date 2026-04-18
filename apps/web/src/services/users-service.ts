import { api } from "@/lib/api";
import type {
  AssignableUser,
  PaginatedUsers,
  RoleItem,
  UserDetail,
} from "@/types/domain";

type CreateUserPayload = {
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  mustChangePassword: boolean;
  roleCodes: string[];
  password?: string;
};

type UpdateUserPayload = Omit<CreateUserPayload, "password">;

type UsersListQuery = {
  accessToken: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  roleCode?: string;
};

const authHeader = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const usersService = {
  async list(query: UsersListQuery) {
    const { accessToken, ...params } = query;
    const { data } = await api.get<PaginatedUsers>("/users", {
      ...authHeader(accessToken),
      params,
    });

    return data;
  },

  async getById(accessToken: string, id: string) {
    const { data } = await api.get<UserDetail>(
      `/users/${id}`,
      authHeader(accessToken),
    );

    return data;
  },

  async create(accessToken: string, payload: CreateUserPayload) {
    const { data } = await api.post("/users", payload, authHeader(accessToken));
    return data;
  },

  async update(accessToken: string, id: string, payload: UpdateUserPayload) {
    const { data } = await api.patch(
      `/users/${id}`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async updateStatus(accessToken: string, id: string, status: string) {
    const { data } = await api.patch(
      `/users/${id}/status`,
      { status },
      authHeader(accessToken),
    );
    return data;
  },

  async resetPassword(
    accessToken: string,
    id: string,
    payload: { newPassword: string; mustChangePassword: boolean },
  ) {
    const { data } = await api.post(
      `/users/${id}/reset-password`,
      payload,
      authHeader(accessToken),
    );
    return data;
  },

  async listRoles(accessToken: string) {
    const { data } = await api.get<RoleItem[]>("/roles", authHeader(accessToken));
    return data;
  },

  async listAssignable(accessToken: string) {
    const { data } = await api.get<AssignableUser[]>(
      "/users/assignable",
      authHeader(accessToken),
    );
    return data;
  },
};
