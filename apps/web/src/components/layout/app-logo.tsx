export function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-600 to-ink-900 text-lg font-bold text-white shadow-soft">
        AI
      </div>
      <div>
        <p className="font-display text-lg tracking-wide text-white">
          Atlas Imobiliaria
        </p>
        <p className="text-xs uppercase tracking-[0.32em] text-white/50">
          Admin Suite
        </p>
      </div>
    </div>
  );
}

