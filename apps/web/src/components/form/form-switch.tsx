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
      className="flex w-full items-center justify-between rounded-2xl border border-ink-200 bg-white px-4 py-3 text-left"
    >
      <div>
        <p className="text-sm font-semibold text-ink-800">{label}</p>
        {description ? (
          <p className="mt-1 text-xs text-ink-500">{description}</p>
        ) : null}
      </div>

      <span
        className={`relative inline-flex h-7 w-12 rounded-full transition ${
          checked ? "bg-brand-600" : "bg-ink-200"
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

