import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[28px] border border-dashed border-brand-200/80 bg-[linear-gradient(180deg,rgba(238,248,245,0.68),rgba(255,255,255,0.78))] px-6 py-12 text-center"
    >
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-brand-700 shadow-[0_18px_34px_-24px_rgba(34,109,87,0.45)]">
        <Sparkles size={20} />
      </div>
      <h3 className="mt-5 font-display text-2xl text-ink-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  );
}
