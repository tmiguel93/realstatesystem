type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="rounded-[32px] border border-white/50 bg-white/80 p-8 shadow-soft backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-brand-600">
        Base de navegacao pronta
      </p>
      <h1 className="mt-4 font-display text-4xl text-ink-950">{title}</h1>
      <p className="mt-4 max-w-3xl text-base text-ink-600">{description}</p>
    </div>
  );
}

