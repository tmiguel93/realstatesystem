import { motion } from "framer-motion";
import type { PropsWithChildren, ReactNode } from "react";

type SectionCardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  actions?: ReactNode;
}>;

export function SectionCard({
  title,
  description,
  actions,
  children,
}: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="panel-card relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200/80 to-transparent" />

      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {title ? (
              <h2 className="font-display text-2xl text-ink-950">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-ink-500">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      {children}
    </motion.section>
  );
}
