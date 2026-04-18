import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormInput({
  label,
  error,
  className,
  ...props
}: FormInputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <input
        className={cn(
          "field-control",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}
