import Link from 'next/link';
import { FadeEmblem } from './FadeEmblem';

// Вітрина до відкриття першої студії (T-4614e): локацій ще немає, тож немає ні
// ціни, ні CTA запису — лише обіцянка відкриття. Щойно перша активна локація
// з'явиться в адмінці, сайт сам повертається до звичайного Hero.

export function HomePreparingHero() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient px-6 py-20 md:px-20 md:py-32 shadow-2xl border border-line-strong/85 backdrop-blur-2xl">
      <div className="absolute -top-32 -right-32 w-[580px] h-[580px] rounded-full bg-accent-blue/25 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-12 opacity-60 hidden lg:block pointer-events-none">
        <FadeEmblem className="w-80 h-80 text-accent-blue drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]" />
      </div>

      <div className="relative z-10 flex flex-col items-start gap-8 max-w-3xl">
        <div className="inline-flex items-center gap-2.5 rounded-pill border border-line-strong bg-surface-sunken/95 backdrop-blur-md px-5 py-2.5 text-caption font-semibold uppercase tracking-wider text-fg">
          <span
            className="h-2.5 w-2.5 rounded-full bg-accent-blue animate-pulse"
            aria-hidden="true"
          />
          Готуємось до відкриття
        </div>

        <h1 className="font-display text-h1 font-extrabold text-fg leading-tight">
          Перша студія FADE скоро відкриється
        </h1>
        <p className="text-bodyLg text-fg-secondary max-w-2xl">
          Ми готуємо простір, майстрів і графік. Онлайн-запис увімкнеться того ж дня, коли студія
          відкриє двері — без окремого оновлення сайту.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/locations"
            className="inline-flex h-14 items-center justify-center rounded-input border border-line-strong bg-interactive px-8 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            Де ми відкриємось
          </Link>
          <Link
            href="/services"
            className="inline-flex h-14 items-center justify-center px-6 text-body font-medium text-fg-secondary hover:text-fg transition-colors rounded-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            Послуги та прайс
          </Link>
        </div>
      </div>
    </section>
  );
}
