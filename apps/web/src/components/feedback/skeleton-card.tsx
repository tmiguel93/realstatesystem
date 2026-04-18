export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[28px] border border-white/50 bg-white/70 p-5 shadow-soft">
      <div className="mb-5 h-12 w-12 rounded-2xl bg-ink-100" />
      <div className="h-4 w-24 rounded bg-ink-100" />
      <div className="mt-3 h-10 w-16 rounded bg-ink-100" />
      <div className="mt-4 h-4 w-40 rounded bg-ink-100" />
    </div>
  );
}

