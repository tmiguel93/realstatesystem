export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  roles: string[];
  permissions: string[];
  lastLoginAt: string | null;
  preferredTheme: "SYSTEM" | "LIGHT" | "DARK";
  preferredLocale: "PT_BR" | "EN" | "ES";
};

export type LoginPayload = {
  email: string;
  senha: string;
};
