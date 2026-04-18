import { Bell, LogOut, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-ink-200/60 bg-white/75 px-5 py-4 shadow-soft backdrop-blur-xl">
      <div className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-sm">
        <Search size={18} className="text-ink-400" />
        <input
          className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          placeholder="Buscar por imovel, lead, contrato ou cliente..."
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 lg:flex">
          <Sparkles size={16} />
          Acoes rapidas
        </button>

        <button className="grid size-12 place-items-center rounded-2xl border border-ink-200 bg-white text-ink-600 transition hover:border-brand-200 hover:text-brand-700">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-2">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sand-300 to-brand-400 font-display text-sm text-white">
            {user?.fullName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-ink-900">{user?.fullName}</p>
            <p className="text-xs uppercase tracking-[0.24em] text-ink-400">
              {user?.roles.join(" · ")}
            </p>
          </div>

          <button
            onClick={() => void logout()}
            className="grid size-10 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

