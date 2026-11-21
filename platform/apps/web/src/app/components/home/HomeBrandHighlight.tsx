import React from 'react';
import Link from 'next/link';

export function HomeBrandHighlight() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-sunken/90 border border-accent-blue/40 p-8 md:p-12 shadow-2xl backdrop-blur-2xl group hover:border-accent-blue transition-all duration-500">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/20 rounded-full blur-[130px] pointer-events-none group-hover:bg-accent-blue/30 transition-all duration-700" />
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/25 border border-accent-blue/40 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue shadow-sm w-fit">
            <span>🔥 Ексклюзивна пропозиція FADE</span>
          </div>
          <h2 className="text-h3 font-display font-bold text-fg leading-tight">
            Перший комплексний догляд зі знижкою 15% та авторським ритуалом
          </h2>
          <p className="text-bodyLg text-fg-secondary">
            Відчуйте різницю приватного простору на 2 крісла. Стрижка бороди або волосся з гарячим
            рушником, стайлінгом та кавою у подарунок для нових гостей мережі.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <Link
            href="/booking"
            className="inline-flex h-12 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-95 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Активувати знижку &rarr;
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 items-center justify-center rounded-input border border-line-strong bg-interactive px-6 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent transition-all"
          >
            Дивитись прайс
          </Link>
        </div>
      </div>
    </section>
  );
}
