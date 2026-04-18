import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { appRoutes } from "@imobiliaria/shared";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page-mesh px-4 py-8">
      <div className="w-full max-w-2xl rounded-[36px] border border-white/50 bg-white/80 p-8 text-center shadow-soft backdrop-blur-xl">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-rose-50 text-rose-600">
          <ShieldAlert size={28} />
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.32em] text-rose-500">
          Acesso bloqueado
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink-950">
          Voce nao tem permissao para esta area.
        </h1>
        <p className="mt-4 text-base text-ink-600">
          O controle de acesso esta funcionando corretamente e protege recursos
          estrategicos do sistema.
        </p>
        <Link
          to={appRoutes.dashboard}
          className="mt-8 inline-flex rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}

