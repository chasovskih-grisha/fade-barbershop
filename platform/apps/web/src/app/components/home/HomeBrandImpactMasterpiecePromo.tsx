import React from 'react';
import Link from 'next/link';

export function HomeBrandImpactMasterpiecePromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-surface-raised via-surface to-surface-sunken border border-accent/40 p-8 md:p-12 shadow-2xl backdrop-blur-2xl group hover:border-accent transition-all duration-500">
      {/* Ambient background glow elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/25 rounded-full blur-[120px] pointer-events-none group-hover:bg-accent/35 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/20 border border-accent/40 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent shadow-sm w-fit">
            <span>✨ FADE Signature • Ексклюзивний бренд-досвід</span>
          </div>
          <h2 className="text-h3 md:text-h2 font-display font-bold text-fg leading-tight">
            Колекційна серія стрижок та королівського гоління «Brand Impact 2026»
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Відчуйте новий стандарт чоловічого догляду у FADE. Поєднання бездоганної архітектури
            стрижки, фірмового ароматерапевтичного гарячого рушника та преміального стайлінгу з
            індивідуальним підбором аромату.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-input bg-surface-sunken/80 border border-line">
              <span className="text-body font-bold text-accent">👑</span>
              <div>
                <h4 className="text-body font-semibold text-fg">Преміальний ритуал</h4>
                <p className="text-caption text-fg-secondary">Повна релаксація та догляд</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-input bg-surface-sunken/80 border border-line">
              <span className="text-body font-bold text-accent">💎</span>
              <div>
                <h4 className="text-body font-semibold text-fg">Ексклюзивний кешбек</h4>
                <p className="text-caption text-fg-secondary">15% балами на наступний візит</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-13 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            <span>Забронювати досвід</span>
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
          <Link
            href="/services"
            className="inline-flex h-13 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input border border-line-strong bg-interactive px-7 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            Переглянути послуги
          </Link>
        </div>
      </div>
    </section>
  );
}
