import { api } from "@/lib/api";
import type { AuthUser, LoginPayload } from "@/types/auth";

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async refresh() {
    const { data } = await api.post<AuthResponse>("/auth/refresh");
    return data;
  },

  async logout(accessToken: string) {
    const { data } = await api.post(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await api.post<{
      message: string;
      previewToken?: string;
    }>("/auth/forgot-password", { email });

    return data;
  },

  async me(accessToken: string) {
    const { data } = await api.get<AuthUser>("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return data;
  },

  async updatePreferences(
    accessToken: string,
    payload: Pick<AuthUser, "preferredTheme" | "preferredLocale">,
  ) {
    const { data } = await api.patch<AuthUser>(
      "/auth/preferences",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return data;
  },
};
