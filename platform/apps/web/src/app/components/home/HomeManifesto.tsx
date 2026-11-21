import Link from 'next/link';

export function HomeManifesto() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-raised border border-line p-8 md:p-16 text-center flex flex-col items-center gap-6 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-accent-blue/5 via-transparent to-transparent pointer-events-none" />

      <div className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface-sunken px-4 py-1.5 text-caption font-medium uppercase text-fg-secondary tracking-wider">
        <span>Філософія FADE</span>
      </div>

      <blockquote className="font-display text-h2 md:text-h1 font-bold text-fg max-w-3xl leading-snug">
        «Прибрати зайве. <br />
        <span className="text-fg-secondary">Залишити форму та спокій.</span>»
      </blockquote>

      <p className="text-bodyLg text-fg-secondary max-w-xl">
        Ми віримо, що ідеальний догляд — це не про шоу чи пафос. Це про чіткість лінії, бездоганний
        перехід та годину тиші для себе серед галасливого міста.
      </p>

      <div className="pt-2">
        <Link
          href="/booking"
          className="inline-flex h-12 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-90 transition-all duration-300"
        >
          Забронювати візит &rarr;
        </Link>
      </div>
    </section>
  );
}
