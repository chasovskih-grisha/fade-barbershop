import React from 'react';
import Link from 'next/link';

export function HomeDormantClientWinBackPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-12 shadow-md">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent w-fit">
            <span>🔄 Персональна реактивація FADE Win-Back</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Давно не бачилися? Отримайте спеціальний бонус повернення до 25%
          </h2>
          <p className="text-body text-fg-secondary">
            Якщо ви не відвідували барбершоп останні 30+ днів, наша система автоматично генерує
            персональний код знижки на ваш наступний візит із пріоритетним часом у мастера.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-input bg-surface-sunken/60 border border-line/65">
              <span className="text-body font-bold text-accent">🏷️</span>
              <div>
                <h4 className="text-body font-semibold text-fg">До 25% знижки</h4>
                <p className="text-caption text-fg-secondary">Залежно від терміну неактивності</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-input bg-surface-sunken/60 border border-line/65">
              <span className="text-body font-bold text-accent">⚡</span>
              <div>
                <h4 className="text-body font-semibold text-fg">Пріоритетний слот</h4>
                <p className="text-caption text-fg-secondary">Без черг та очікування</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto">
          <Link
            href="/account"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md text-center"
          >
            Активувати Win-Back &rarr;
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all text-center"
          >
            Записатися зараз
          </Link>
        </div>
      </div>
    </section>
  );
}
