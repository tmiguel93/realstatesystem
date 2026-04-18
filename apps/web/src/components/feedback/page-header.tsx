import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[30px] bg-hero-mesh p-6 text-white shadow-soft lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.3em] text-white/55">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-display text-4xl leading-tight">{title}</h1>
        <p className="mt-3 text-sm text-white/74 md:text-base">{description}</p>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

