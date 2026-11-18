import Link from 'next/link';
import { FadeEmblem } from './FadeEmblem';

export function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient px-6 py-20 md:px-20 md:py-40 shadow-2xl border border-line-strong/85 backdrop-blur-2xl group hover:border-accent-blue/60 transition-all duration-700">
      {/* Cinematic Atmospheric lighting effects with optimized blur and soft placeholder depth */}
      <div className="absolute -top-32 -right-32 w-[580px] h-[580px] rounded-full bg-accent-blue/25 blur-[140px] pointer-events-none animate-fade-glow will-change-transform" />
      <div className="absolute -bottom-28 -left-20 w-[620px] h-[620px] rounded-full bg-accent-blue/15 blur-[160px] pointer-events-none will-change-transform" />
      <div className="absolute top-1/4 right-12 opacity-60 hidden lg:block pointer-events-none group-hover:scale-105 group-hover:rotate-3 transition-transform duration-700 ease-out">
        <FadeEmblem className="w-80 h-80 text-accent-blue drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]" />
      </div>

      <div className="relative z-10 flex flex-col items-start gap-10 max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2.5 rounded-pill border border-line-strong bg-surface-sunken/95 backdrop-blur-md px-5 py-2.5 text-caption font-semibold uppercase tracking-wider text-fg shadow-lg">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-blue animate-pulse shadow-[0_0_14px_rgba(59,130,246,0.9)]" aria-hidden="true" />
            Приватна студія на 2 крісла • Центр Києва • Преміум стандарти
          </div>
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/20 border border-accent-blue/40 px-5 py-2.5 text-caption font-semibold text-accent-blue shadow-lg backdrop-blur-md hover:bg-accent-blue/30 transition-colors">
            ✨ Вільні вікна на сьогодні — Онлайн-запис за 60с
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 rounded-pill bg-surface-sunken/90 border border-line px-4.5 py-2.5 text-caption font-medium text-fg-secondary shadow-sm">
            ✂️ Експертний догляд та гарячі рушники
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="font-display text-[3.25rem] sm:text-[5.25rem] font-extrabold text-fg leading-[0.94] tracking-wider">
            Точність форми. <br />
            <span className="fade-gradient-text drop-shadow-xl inline-block mt-1">
              Мистецтво бритви та преміум стилю.
            </span>
          </h1>
          <p className="text-bodyLg sm:text-[1.3rem] text-fg-secondary max-w-2xl font-normal leading-relaxed">
            Преміальний сусідський барбершоп без конвеєра та метушні. Особистий час, бездоганна геометрія стрижки, авторські ритуали, гарячі рушники та спокійна атмосфера за дві хвилини від дому.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Link
            href="/booking"
            className="inline-flex h-14 items-center justify-center rounded-input bg-accent px-10 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-2xl hover:scale-[1.02] active:scale-[0.98] ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 group/btn"
            aria-label="Записатися онлайн до барбершопу"
          >
            <span>Записатися онлайн</span>
            <span className="ml-2 inline-block transition-transform duration-300 group-hover/btn:translate-x-1">&rarr;</span>
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
            <span className="ml-1.5 inline-block transition-transform duration-300 group-hover/link:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5 border-t border-line/90 pt-8 sm:grid-cols-4 w-full">
          <div className="space-y-1.5 p-5 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line-strong backdrop-blur-md shadow-lg hover:border-accent-blue hover:bg-surface-sunken hover:scale-[1.02] transition-all duration-300 group/metric">
            <div className="text-h4 font-display font-bold text-fg group-hover/metric:text-accent-blue transition-colors">2 крісла</div>
            <div className="text-caption text-fg-muted uppercase font-semibold tracking-wider">Приватність і тиша</div>
          </div>
          <div className="space-y-1.5 p-5 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line-strong backdrop-blur-md shadow-lg hover:border-accent-blue hover:bg-surface-sunken hover:scale-[1.02] transition-all duration-300 group/metric">
            <div className="text-h4 font-display font-bold text-fg group-hover/metric:text-accent-blue transition-colors">60 сек</div>
            <div className="text-caption text-fg-muted uppercase font-semibold tracking-wider">Миттєвий запис</div>
          </div>
          <div className="space-y-1.5 p-5 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line-strong backdrop-blur-md shadow-lg hover:border-accent-blue hover:bg-surface-sunken hover:scale-[1.02] transition-all duration-300 group/metric">
            <div className="text-h4 font-display font-bold text-fg group-hover/metric:text-accent-blue transition-colors">600 ₴</div>
            <div className="text-caption text-fg-muted uppercase font-semibold tracking-wider">Перша стрижка</div>
          </div>
          <div className="space-y-1.5 p-5 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line-strong backdrop-blur-md shadow-lg hover:border-accent-blue hover:bg-surface-sunken hover:scale-[1.02] transition-all duration-300 group/metric">
            <div className="text-h4 font-display font-bold text-fg group-hover/metric:text-accent-blue transition-colors">Ритуал</div>
            <div className="text-caption text-fg-muted uppercase font-semibold tracking-wider">Гарячий рушник</div>
          </div>
        </div>
      </div>
    </section>
  );
}
