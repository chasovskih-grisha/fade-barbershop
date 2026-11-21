import Link from 'next/link';

export function ServicesPageHeader() {
  return (
    <header className="flex flex-col gap-6 border-b border-line pb-12 relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient p-8 md:p-14 shadow-xl border-line-strong/60">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />
      <Link
        href="/"
        className="text-body text-fg-secondary hover:text-fg w-fit transition-colors flex items-center gap-2 relative z-10"
      >
        &larr; На головну
      </Link>
      <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4.5 py-2 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm relative z-10">
        ✦ Архітектурне меню та ритуали FADE
      </div>
      <h1 className="font-display text-[2.75rem] md:text-[3.5rem] font-bold text-fg leading-none relative z-10">
        Послуги та фіксований прайс
      </h1>
      <p className="max-w-3xl text-bodyLg text-fg-secondary relative z-10">
        Прозорий прайс без прихованих доплат і поспіху. У кожну класичну стрижку входять детальне
        консультування, миття голови професійною косметикою, стайлінг та фірмовий ритуал гарячого
        рушника.
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-2 relative z-10">
        {['Усі послуги', 'Класичні стрижки', 'Моделювання бороди', 'Комплексні ритуали'].map(
          (category, index) => (
            <span
              key={category}
              className={`inline-flex items-center rounded-pill px-4 py-2 text-caption font-semibold shadow-sm ${
                index === 0
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg transition-colors cursor-pointer font-medium'
              }`}
            >
              {category}
            </span>
          )
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-card border-2 border-accent-blue/40 bg-surface-sunken p-8 shadow-xl backdrop-blur-md relative z-10">
        <div className="flex flex-col gap-2">
          <span className="text-bodyLg font-display font-bold text-fg">
            Спеціальна пропозиція для нових гостей
          </span>
          <span className="text-body text-fg-secondary">
            Знижка -100 ₴ на першу чоловічу стрижку при онлайн-записі в будь-яку студію мережі Fade
          </span>
        </div>
        <Link
          href="/booking"
          className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 w-fit shrink-0 transition-all shadow-lg hover:scale-[1.02]"
        >
          Скористатися знижкою &rarr;
        </Link>
      </div>
    </header>
  );
}
