import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth-service";
import type { AuthUser, LoginPayload } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const bootstrapSession = useCallback(async () => {
    try {
      const result = await authService.refresh();
      setAccessToken(result.accessToken);
      setUser(result.user);
      setStatus("authenticated");
    } catch {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authService.login(payload);
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus("authenticated");
    toast.success(`Bem-vindo de volta, ${result.user.fullName.split(" ")[0]}.`);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
      toast.success("Sessao encerrada.");
    }
  }, [accessToken]);

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      accessToken,
      user,
      login,
      logout,
      hasPermission,
    }),
    [status, accessToken, user, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }

  return context;
}

