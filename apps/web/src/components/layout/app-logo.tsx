export function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-300 via-brand-500 to-ink-900 text-lg font-bold text-white shadow-[0_16px_30px_-18px_rgba(24,57,48,0.34)]">
        AI
      </div>
      <div>
        <p className="font-display text-lg tracking-wide text-ink-950">
          Atlas Imobiliaria
        </p>
        <p className="text-[11px] uppercase tracking-[0.34em] text-ink-400">
          Admin Suite
        </p>
      </div>
    </div>
  );
}
