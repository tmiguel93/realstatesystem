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
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[720px] border-l border-white/50 bg-[#f7f5f0] shadow-[0_0_0_1px_rgba(255,255,255,0.4),-24px_0_80px_-32px_rgba(23,33,31,0.55)]">
        <div className="flex h-full flex-col">
          <div className="border-b border-ink-200/70 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-brand-600">
                  Edicao e cadastro
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink-950">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 text-sm text-ink-500">{description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid size-11 place-items-center rounded-2xl border border-ink-200 bg-white text-ink-500 transition hover:text-ink-950"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

          {footer ? (
            <div className="border-t border-ink-200/70 bg-white/80 px-6 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

