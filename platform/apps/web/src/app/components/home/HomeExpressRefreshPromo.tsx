import React from 'react';
import Link from 'next/link';

export function HomeExpressRefreshPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-r from-surface to-interactive border border-line p-8 md:p-10 shadow-lg">
      {/* Ambient background glow */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent w-fit">
            <span>⚡ Експрес-догляд • 20 хвилин</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Express Refresh між повними візитами: підтримка ідеального канту
          </h2>
          <p className="text-body text-fg-secondary">
            Немає часу на повну стрижку, але важливо мати бездоганний вигляд на зустрічі чи зйомці?
            Скористайтесь 20-хвилинним експрес-оновленням контуру скроень та бороди у нашому
            затишному просторі.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md"
          >
            Записатися на Express &rarr;
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all"
          >
            Усі послуги
          </Link>
        </div>
      </div>
    </section>
  );
}
