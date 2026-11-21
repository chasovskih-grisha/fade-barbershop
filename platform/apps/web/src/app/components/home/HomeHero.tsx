import Link from 'next/link';
import { HeroAtmosphere } from './HeroAtmosphere';
import { HeroBadges } from './HeroBadges';
import { HeroMetrics } from './HeroMetrics';

export function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient px-6 py-20 md:px-20 md:py-40 shadow-2xl border border-line-strong/85 backdrop-blur-2xl group hover:border-accent-blue/60 transition-all duration-700">
      <HeroAtmosphere />

      <div className="relative z-10 flex flex-col items-start gap-10 max-w-4xl">
        <HeroBadges />

        <div className="space-y-6">
          <h1 className="font-display text-[3.25rem] sm:text-[5.25rem] font-extrabold text-fg leading-[0.94] tracking-wider">
            Точність форми. <br />
            <span className="fade-gradient-text drop-shadow-xl inline-block mt-1">
              Мистецтво бритви та преміум стилю.
            </span>
          </h1>
          <p className="text-bodyLg sm:text-[1.3rem] text-fg-secondary max-w-2xl font-normal leading-relaxed">
            Преміальний сусідський барбершоп без конвеєра та метушні. Особистий час, бездоганна
            геометрія стрижки, авторські ритуали, гарячі рушники та спокійна атмосфера за дві
            хвилини від дому.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Link
            href="/booking"
            className="inline-flex h-14 items-center justify-center rounded-input bg-accent px-10 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-2xl hover:scale-[1.02] active:scale-[0.98] ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 group/btn"
            aria-label="Записатися онлайн до барбершопу"
          >
            <span>Записатися онлайн</span>
            <span className="ml-2 inline-block transition-transform duration-300 group-hover/btn:translate-x-1">
              &rarr;
            </span>
          </Link>
          <Link
            href="/services"
            className="inline-flex h-14 items-center justify-center rounded-input border border-line-strong bg-interactive px-8 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-[0.98] ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            aria-label="Переглянути послуги та прайс"
          >
            Послуги та прайс
          </Link>
          <Link
            href="/barbers"
            className="inline-flex h-14 items-center justify-center px-6 text-body font-medium text-fg-secondary hover:text-fg transition-colors ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-input group/link"
            aria-label="Дізнатися більше про наших майстрів"
          >
            <span>Наші майстри</span>
            <span className="ml-1.5 inline-block transition-transform duration-300 group-hover/link:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>

        <HeroMetrics />
      </div>
    </section>
  );
}
