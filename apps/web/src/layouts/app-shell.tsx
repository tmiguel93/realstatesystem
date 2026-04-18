import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
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
        <motion.aside
          initial={{ opacity: 0, x: -22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed inset-y-3 left-3 z-40 w-[300px] rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(252,249,244,0.98),rgba(244,240,232,0.94))] p-5 shadow-[0_28px_65px_-36px_rgba(24,57,48,0.22)] transition duration-300 lg:static lg:inset-auto lg:block lg:w-auto",
            mobileOpen ? "translate-x-0" : "-translate-x-[115%] lg:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between">
            <AppLogo />
            <button
              onClick={() => setMobileOpen(false)}
              className="grid size-10 place-items-center rounded-2xl border border-ink-200/80 text-ink-700 transition hover:bg-ink-100 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-8">
            <SidebarNav />
          </div>
        </motion.aside>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm lg:hidden"
            />
          ) : null}
        </AnimatePresence>

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
          className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(248,245,239,0.95),rgba(244,240,232,0.88))] p-3 shadow-[0_28px_70px_-34px_rgba(24,57,48,0.2)] md:p-5"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,139,110,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(193,133,63,0.07),transparent_20%)]" />

          <div className="relative">
            <div className="mb-4 flex justify-end lg:hidden">
              <button
                onClick={() => setMobileOpen(true)}
                className="secondary-button"
              >
                <Menu size={18} />
                Menu
              </button>
            </div>

            <Topbar />

            <div className="mt-5 animate-floatIn">
              <Outlet />
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
