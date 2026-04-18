import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function FormTextarea({
  label,
  error,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <textarea
        className={cn(
          "field-control min-h-[132px]",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}
