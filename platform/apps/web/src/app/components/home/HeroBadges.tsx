export function HeroBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2.5 rounded-pill border border-line-strong bg-surface-sunken/95 backdrop-blur-md px-5 py-2.5 text-caption font-semibold uppercase tracking-wider text-fg shadow-lg">
        <span
          className="h-2.5 w-2.5 rounded-full bg-accent-blue animate-pulse shadow-[0_0_14px_rgba(59,130,246,0.9)]"
          aria-hidden="true"
        />
        Приватна студія на 2 крісла • Центр Києва • Преміум стандарти
      </div>
      <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/20 border border-accent-blue/40 px-5 py-2.5 text-caption font-semibold text-accent-blue shadow-lg backdrop-blur-md hover:bg-accent-blue/30 transition-colors">
        ✨ Вільні вікна на сьогодні — Онлайн-запис за 60с
      </div>
      <div className="hidden sm:inline-flex items-center gap-2 rounded-pill bg-surface-sunken/90 border border-line px-4.5 py-2.5 text-caption font-medium text-fg-secondary shadow-sm">
        ✂️ Експертний догляд та гарячі рушники
      </div>
    </div>
  );
}
