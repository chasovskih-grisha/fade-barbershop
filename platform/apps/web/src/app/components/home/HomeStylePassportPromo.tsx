import React from 'react';
import Link from 'next/link';

export function HomeStylePassportPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-surface via-interactive to-surface border border-line p-8 md:p-10 shadow-lg">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent w-fit">
            <span>🛡️ Style Passport • 4 Візити</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Абонемент «Style Passport»: фіксована ціна, пріоритет та персональний майстер
          </h2>
          <p className="text-body text-fg-secondary">
            Забезпечте собі бездоганний стиль на місяці вперед. Абонемент включає 4 комплексні візити із захистом від змін цін, ексклюзивним правом на бронювання ранкових/вечірніх слотів та персональним підбором догляду.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-md"
          >
            Оформити Passport &rarr;
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all"
          >
            Переглянути послуги
          </Link>
        </div>
      </div>
    </section>
  );
}
