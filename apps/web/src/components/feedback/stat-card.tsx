import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
};

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <article className="group rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-soft backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-30px_rgba(24,57,48,0.45)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-ink-950 text-white shadow-soft">
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
    </article>
  );
}

