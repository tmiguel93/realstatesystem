import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

type DrawerProps = PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
}>;

export function Drawer({
  open,
  title,
  description,
  onClose,
  footer,
  children,
}: DrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink-950/42 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 48 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 h-full w-full max-w-[760px] border-l border-white/70 bg-[linear-gradient(180deg,rgba(248,245,239,0.98),rgba(244,240,232,0.94))] shadow-[0_0_0_1px_rgba(255,255,255,0.48),-30px_0_90px_-36px_rgba(23,33,31,0.48)]"
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-ink-200/70 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-brand-600">
                      Edicao e cadastro
                    </p>
                    <h2 className="mt-2 font-display text-3xl text-ink-950">
                      {title}
                    </h2>
                    {description ? (
                      <p className="mt-2 max-w-2xl text-sm text-ink-500">
                        {description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="grid size-11 place-items-center rounded-2xl border border-ink-200/80 bg-white/92 text-ink-500 transition duration-200 hover:border-brand-200 hover:text-ink-950"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

              {footer ? (
                <div className="border-t border-ink-200/70 bg-white/78 px-6 py-4 backdrop-blur-xl">
                  {footer}
                </div>
              ) : null}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
