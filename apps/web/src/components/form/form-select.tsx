import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Option = {
  value: string;
  label: string;
};

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
  placeholder?: string;
  error?: string;
};

export function FormSelect({
  label,
  options,
  placeholder,
  error,
  className,
  ...props
}: FormSelectProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <select
        className={cn(
          "field-control",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
          className,
        )}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}
