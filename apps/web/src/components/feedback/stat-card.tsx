import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
};

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="group panel-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-ink-950 to-brand-700 text-white shadow-[0_18px_34px_-24px_rgba(24,57,48,0.65)]">
          {icon}
        </div>
        <ArrowUpRight
          size={18}
          className="text-ink-300 transition group-hover:text-brand-500"
        />
      </div>
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-2 font-display text-4xl text-ink-950">{value}</p>
      <p className="mt-3 text-sm text-ink-500">{detail}</p>
    </motion.article>
  );
}
