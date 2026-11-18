import Link from 'next/link';

export function HomeCraftsmanship() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-raised border border-line p-8 md:p-16 shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-80 h-80 bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-surface-sunken/80 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 border border-accent-blue/30 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
            ✦ Фірмовий Стандарт FADE • Архітектура та Стиль
          </div>
          <h2 className="font-display text-h2 md:text-h1 font-bold text-fg leading-[1.1]">
            Прибрати зайве. <br />
            <span className="fade-gradient-text">Залишити форму.</span>
          </h2>
          <p className="text-bodyLg text-fg-secondary">
            У світі, перенасиченому шумом, справжня розкіш — це точність і тиша. Наша студія на два крісла у центрі Києва створена для тих, хто цінує бездоганну геометрію стрижки та особистий час.
          </p>
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-4 p-4 rounded-[var(--radius-card)] bg-surface-sunken/60 border border-line hover:border-accent-blue/40 transition-colors">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/20 text-accent-blue font-bold text-sm">01</span>
              <div>
                <h3 className="font-display font-semibold text-fg">Ювелірна геометрія</h3>
                <p className="text-caption text-fg-secondary mt-0.5">Кожен міліметр вивірений під овал вашого обличчя та природний напрямок росту волосся.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-[var(--radius-card)] bg-surface-sunken/60 border border-line hover:border-accent-blue/40 transition-colors">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/20 text-accent-blue font-bold text-sm">02</span>
              <div>
                <h3 className="font-display font-semibold text-fg">Ритуал гарячого рушника</h3>
                <p className="text-caption text-fg-secondary mt-0.5">Класичне гоління небезпечною бритвою, ароматерапія та повна релаксація у затишку.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-[var(--radius-card)] bg-surface-sunken/60 border border-line hover:border-accent-blue/40 transition-colors">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/20 text-accent-blue font-bold text-sm">03</span>
              <div>
                <h3 className="font-display font-semibold text-fg">Преміум стайлінг та догляд</h3>
                <p className="text-caption text-fg-secondary mt-0.5">Підбір професійної косметики для щоденного догляду та фіксації без обтяження.</p>
              </div>
            </div>
          </div>
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              href="/booking"
              className="inline-flex h-12 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-md"
            >
              Забронювати сеанс &rarr;
            </Link>
            <Link
              href="/services"
              className="inline-flex h-12 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all"
            >
              Переглянути послуги
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 relative">
          <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-sunken p-8 md:p-12 shadow-2xl flex flex-col justify-between aspect-[4/3] group">
            {/* Cinematic architectural watermark */}
            <div className="absolute right-4 bottom-4 text-[120px] font-display font-black text-fg/5 select-none pointer-events-none group-hover:text-accent-blue/10 transition-colors duration-700">
              FA
            </div>

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 px-3 py-1 text-caption font-semibold text-accent-blue border border-accent-blue/30">
                ✦ Концепція приватного простору
              </div>
              <h3 className="font-display text-h3 font-bold text-fg">ЖК «Сіті Лейк» • Центр Києва</h3>
              <p className="text-body text-fg-secondary">
                «Ти виходиш кращою версією себе — не іншою людиною.»
              </p>
            </div>

            <div className="relative z-10 pt-8 border-t border-line flex items-center justify-between text-body">
              <div>
                <span className="text-caption text-fg-muted block uppercase font-medium">Графік роботи</span>
                <span className="font-semibold text-fg">Щодня з 09:00 до 21:00</span>
              </div>
              <Link
                href="/locations"
                className="inline-flex items-center gap-1.5 font-semibold text-accent-blue hover:underline"
              >
                Усі адреси &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
