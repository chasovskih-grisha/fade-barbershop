import React from 'react';
import Link from 'next/link';

export function HomeFlashSaleFlashbackPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-surface-raised via-surface to-surface-sunken border border-accent/40 p-8 md:p-12 shadow-2xl backdrop-blur-2xl group hover:border-accent transition-all duration-500">
      {/* Dynamic ambient glow & badge */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-accent/30 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/20 border border-accent/40 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent shadow-sm w-fit animate-pulse">
            <span>⚡ Ексклюзивний Flash Sale • Обмежена пропозиція</span>
          </div>
          <h2 className="text-h3 md:text-h2 font-display font-bold text-fg leading-tight">
            «Midnight Flash Sale»: знижка -30% на ранковий та пізній вечірній прем'єрний догляд
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Забронюйте преміальну стрижку та королівське гоління у години максимальної тиші (з 08:00 по 10:00 або з 20:00 по 22:00) за спеціальною ціною. Повна конфіденційність, розслаблена атмосфера та персональний вибір напоїв у подарунок.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-fg-secondary">
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-accent text-base">✓</span> Економія 30% на всіх топ-послугах
            </span>
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-accent text-base">✓</span> Ідеальні години без черг
            </span>
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-accent text-base">✓</span> welcome drink у подарунок
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Забронювати зі знижкою</span>
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </Link>
          <Link
            href="/services"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input border border-line-strong bg-interactive px-7 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            Переглянути графік
          </Link>
        </div>
      </div>
    </section>
  );
}
