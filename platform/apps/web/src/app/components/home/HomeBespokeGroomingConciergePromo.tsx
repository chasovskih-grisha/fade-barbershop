import React from 'react';
import Link from 'next/link';

export function HomeBespokeGroomingConciergePromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-r from-surface-raised via-surface-sunken to-surface-raised border border-accent/30 p-8 md:p-12 shadow-2xl backdrop-blur-2xl group hover:border-accent transition-all duration-500">
      {/* Ambient glow effects */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-accent/15 rounded-full blur-[120px] pointer-events-none group-hover:bg-accent/25 transition-all duration-700" />
      <div className="absolute bottom-0 left-12 w-72 h-72 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/20 border border-accent/40 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent shadow-sm w-fit">
            <span>💎 Елітний сервіс • FADE Bespoke Grooming Concierge</span>
          </div>
          <h2 className="text-h3 md:text-h2 font-display font-bold text-fg leading-tight">
            «Bespoke Grooming Concierge»: індивідуальне курування іміджу та виїзний сервіс вищого
            рівня
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Персональний консьєрж-сервіс для лідерів думок, топ-менеджерів та публічних осіб.
            Комплексний догляд, підбір стилю під важливі події, консультації з трихології та
            можливість замовлення майстра додому, в офіс або готель.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-fg-secondary">
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-accent text-base">✓</span> Персональний імідж-консультант
            </span>
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-accent text-base">✓</span> Виїзд топ-барбера до офісу/готелю
            </span>
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-accent text-base">✓</span> Конфіденційне обслуговування 24/7
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Замовити Concierge</span>
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
          <Link
            href="/services"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input border border-line-strong bg-interactive px-7 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            Усі послуги
          </Link>
        </div>
      </div>
    </section>
  );
}
