import { motion } from "framer-motion";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type ChartItem = {
  key: string;
  label: string;
  value: number;
  tone?: "brand" | "warning" | "danger" | "info" | "neutral";
};

type TrendItem = {
  date: string;
  open: number;
  inProgress: number;
  finished: number;
};

const toneClassMap = {
  brand: "from-brand-600 to-brand-400",
  warning: "from-amber-500 to-amber-300",
  danger: "from-rose-600 to-rose-400",
  info: "from-sky-500 to-sky-300",
  neutral: "from-ink-500 to-ink-300",
} as const;

export function MaintenanceHorizontalBars({
  items,
  emptyMessage = "Sem dados suficientes para montar o grafico.",
  valueSuffix = "",
}: {
  items: ChartItem[];
  emptyMessage?: string;
  valueSuffix?: string;
}) {
  if (!items.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
        {emptyMessage}
      </div>
    );
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.24,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.04 * index,
          }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink-800">{item.label}</p>
            <p className="text-sm font-semibold text-ink-950">
              {item.value}
              {valueSuffix}
            </p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-ink-100">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                toneClassMap[item.tone ?? "brand"],
              )}
              style={{
                width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0)}%`,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function MaintenanceTrendChart({ items }: { items: TrendItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
        Sem historico suficiente para exibicao.
      </div>
    );
  }

  const maxValue = Math.max(
    ...items.flatMap((item) => [item.open, item.inProgress, item.finished]),
    1,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-7">
      {items.map((item, index) => (
        <motion.article
          key={item.date}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.03 * index,
          }}
          className="rounded-[24px] border border-ink-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(251,248,243,0.88))] px-3 py-4"
        >
          <div className="flex min-h-[150px] items-end justify-center gap-2">
            {[
              { label: "A", value: item.open, tone: "brand" as const },
              {
                label: "E",
                value: item.inProgress,
                tone: "warning" as const,
              },
              {
                label: "F",
                value: item.finished,
                tone: "info" as const,
              },
            ].map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[11px] font-semibold text-ink-500">
                  {bar.value}
                </div>
                <div className="flex h-[108px] w-full items-end rounded-full bg-ink-100 p-1">
                  <div
                    className={cn(
                      "w-full rounded-full bg-gradient-to-t",
                      toneClassMap[bar.tone],
                    )}
                    style={{
                      height: `${Math.max((bar.value / maxValue) * 100, bar.value > 0 ? 10 : 0)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                  {bar.label}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
            {formatDate(item.date)}
          </p>
        </motion.article>
      ))}
    </div>
  );
}
