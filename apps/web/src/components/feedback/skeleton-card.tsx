export function SkeletonCard() {
  return (
    <div className="panel-card skeleton-shimmer">
      <div className="mb-5 h-12 w-12 rounded-2xl bg-ink-100/85" />
      <div className="h-4 w-24 rounded-full bg-ink-100/85" />
      <div className="mt-3 h-10 w-16 rounded-2xl bg-ink-100/85" />
      <div className="mt-4 h-4 w-40 rounded-full bg-ink-100/85" />
    </div>
  );
}
