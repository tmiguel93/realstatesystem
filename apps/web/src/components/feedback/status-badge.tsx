import { cn } from "@/lib/cn";

type StatusBadgeProps = {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "brand";
};

const toneClasses = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  danger: "bg-rose-50 text-rose-700 border-rose-100",
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
} as const;

export function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}

