export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  roles: string[];
  permissions: string[];
  lastLoginAt: string | null;
};

export type LoginPayload = {
  email: string;
  senha: string;
};

