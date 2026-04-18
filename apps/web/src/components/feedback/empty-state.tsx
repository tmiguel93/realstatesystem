import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-ink-200 bg-ink-50/70 px-6 py-12 text-center">
      <h3 className="font-display text-2xl text-ink-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

