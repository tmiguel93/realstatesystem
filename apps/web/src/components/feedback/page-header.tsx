import { motion } from "framer-motion";
import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[32px] border border-brand-900/8 bg-[linear-gradient(135deg,rgba(24,57,48,0.96),rgba(29,63,54,0.92),rgba(97,57,40,0.88))] p-6 text-white shadow-[0_24px_60px_-30px_rgba(24,57,48,0.58)] lg:flex lg:items-end lg:justify-between"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_18%)]" />

      <div className="relative max-w-3xl">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.3em] text-white/56">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-display text-4xl leading-tight">{title}</h1>
        <p className="mt-3 text-sm text-white/74 md:text-base">{description}</p>
      </div>

      {actions ? (
        <div className="relative mt-5 shrink-0 rounded-[26px] border border-white/12 bg-white/[0.08] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] lg:mt-0">
          {actions}
        </div>
      ) : null}
    </motion.div>
  );
}
