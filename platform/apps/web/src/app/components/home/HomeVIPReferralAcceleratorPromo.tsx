import React from 'react';
import Link from 'next/link';

export function HomeVIPReferralAcceleratorPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-surface-raised via-surface to-surface-sunken border border-accent/40 p-8 md:p-12 shadow-2xl backdrop-blur-2xl group hover:border-accent transition-all duration-500">
      {/* Ambient background glow elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-accent/30 transition-all duration-700" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/20 border border-accent/40 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent shadow-sm w-fit">
            <span>✨ Ексклюзивний бустер • VIP &amp; Реферали</span>
          </div>
          <h2 className="text-h3 md:text-h2 font-display font-bold text-fg leading-tight">
            Подвійний привілей FADE: статус VIP-клубу зі знижкою -20% та реферальний бонус 300 ₴
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Отримайте безлімітний пріоритетний запис, закріпленого топ-майстра та щомісячний презент
            преміум-косметики. А запросивши друга, ви обоє отримуєте по 300 ₴ бонусів на рахунок у
            першій приватній студії центру Києва.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-input bg-surface-sunken/80 border border-line">
              <span className="text-body font-bold text-accent">👑</span>
              <div>
                <h4 className="text-body font-semibold text-fg">VIP-членство -20%</h4>
                <p className="text-caption text-fg-secondary">Безліміт і консьєрж 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-input bg-surface-sunken/80 border border-line">
              <span className="text-body font-bold text-accent">💎</span>
              <div>
                <h4 className="text-body font-semibold text-fg">300 ₴ за друга</h4>
                <p className="text-caption text-fg-secondary">Миттєве зарахування на баланс</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto">
          <Link
            href="/account"
            className="inline-flex h-13 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            <span>Активувати VIP-статус</span>
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
          <Link
            href="/account/referrals"
            className="inline-flex h-13 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input border border-line-strong bg-interactive px-7 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            Запросити друга
          </Link>
        </div>
      </div>
    </section>
  );
}
