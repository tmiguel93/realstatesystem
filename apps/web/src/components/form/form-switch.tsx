type FormSwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function FormSwitch({
  label,
  description,
  checked,
  onChange,
}: FormSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-ink-200/80 bg-white/92 px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition duration-200 hover:-translate-y-px hover:border-brand-200"
    >
      <div>
        <p className="text-sm font-semibold text-ink-800">{label}</p>
        {description ? (
          <p className="mt-1 text-xs text-ink-500">{description}</p>
        ) : null}
      </div>

      <span
        className={`relative inline-flex h-7 w-12 rounded-full transition duration-200 ${
          checked
            ? "bg-gradient-to-r from-brand-500 to-brand-700 shadow-[0_10px_24px_-16px_rgba(34,109,87,0.65)]"
            : "bg-ink-200"
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition duration-200 ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
