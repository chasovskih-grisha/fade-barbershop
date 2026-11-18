import Link from 'next/link';

export function HomeVisualBanner() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-raised border border-line-strong/90 p-8 md:p-14 shadow-2xl transition-all duration-500 hover:border-accent-blue/70 group/visual">
      {/* Background ambient lighting with depth and soft blur */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-accent-blue/15 rounded-full blur-[120px] pointer-events-none animate-pulse will-change-transform" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-blue/10 rounded-full blur-[130px] pointer-events-none will-change-transform" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4 py-2 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit shadow-md backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-accent-blue animate-ping" aria-hidden="true" />
            <span>✦ Сучасна естетика FADE</span>
          </div>
          <h2 className="font-display text-h2 md:text-h1 font-extrabold text-fg leading-[1.08] tracking-wider">
            Форма, яка говорить за вас.
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed font-normal">
            Бездоганні переходи, ювелірна робота бритви та спокійна атмосфера на два крісла. Ми створюємо догляд, у якому немає нічого зайвого — лише ви та ваш найкращий стиль.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/booking"
              className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Забронювати візит &rarr;
            </Link>
            <Link
              href="/barbers"
              className="inline-flex h-13 items-center justify-center rounded-input border border-line-strong bg-interactive px-7 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-all duration-300 shadow-sm"
            >
              Наші майстри
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface-sunken/95 p-6 border border-line-strong shadow-lg transition-all duration-300 hover:border-accent-blue/60 hover:scale-[1.03] group/card backdrop-blur-md">
            <div className="text-h3 font-display font-extrabold text-accent-blue group-hover/card:scale-110 transition-transform duration-300">01</div>
            <div className="text-body font-bold text-fg">Чиста геометрія</div>
            <p className="text-caption text-fg-secondary leading-relaxed">Кожна лінія вивірена до міліметра під овал вашого обличчя.</p>
          </div>
          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface-sunken/95 p-6 border border-line-strong shadow-lg mt-6 transition-all duration-300 hover:border-accent-blue/60 hover:scale-[1.03] group/card backdrop-blur-md">
            <div className="text-h3 font-display font-extrabold text-accent-blue group-hover/card:scale-110 transition-transform duration-300">02</div>
            <div className="text-body font-bold text-fg">Тиха година</div>
            <p className="text-caption text-fg-secondary leading-relaxed">Приватна студія на 2 крісла замість галасливих салонів.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
