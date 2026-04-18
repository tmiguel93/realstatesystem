import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppLogo } from "@/components/layout/app-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/cn";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page-mesh px-3 py-3 text-ink-950 md:px-5 md:py-5">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1680px] grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside
          className={cn(
            "fixed inset-y-3 left-3 z-40 w-[300px] rounded-[32px] border border-white/10 bg-hero-mesh p-5 shadow-soft transition duration-300 lg:static lg:inset-auto lg:block lg:w-auto",
            mobileOpen ? "translate-x-0" : "-translate-x-[115%] lg:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between">
            <AppLogo />
            <button
              onClick={() => setMobileOpen(false)}
              className="grid size-10 place-items-center rounded-2xl border border-white/10 text-white/80 lg:hidden"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-4 text-white/88 shadow-insetGlow">
            <p className="text-xs uppercase tracking-[0.26em] text-white/45">
              Centro operacional
            </p>
            <p className="mt-3 font-display text-2xl">
              Operacao clara, comercial forte e acesso seguro.
            </p>
          </div>

          <div className="mt-6">
            <SidebarNav />
          </div>
        </aside>

        {mobileOpen ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm lg:hidden"
          />
        ) : null}

        <main className="relative overflow-hidden rounded-[36px] border border-white/60 bg-[#f5f4f0] p-3 shadow-soft md:p-5">
          <div className="mb-4 flex justify-end lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-900"
            >
              <Menu size={18} />
              Menu
            </button>
          </div>

          <Topbar />

          <div className="mt-5 animate-floatIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
