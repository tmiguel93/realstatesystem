import { Navigate, Outlet, useLocation } from "react-router-dom";
import { appRoutes } from "@imobiliaria/shared";
import { useAuth } from "@/features/auth/auth-context";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 text-sand-50">
      <div className="rounded-[32px] border border-white/10 bg-white/5 px-8 py-6 shadow-soft backdrop-blur">
        <p className="font-display text-xl">Carregando sua sessao...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const location = useLocation();
  const { status } = useAuth();

  if (status === "loading") {
    return <AuthLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to={appRoutes.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

