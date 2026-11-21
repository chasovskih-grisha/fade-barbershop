import React from 'react';
import Link from 'next/link';

export function HomeNightOwlPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-r from-surface to-interactive border border-line p-8 md:p-10 shadow-lg">
      {/* Ambient background glow */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
            <span>🌙 Пізні візити • До 22:00</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Індивідуальний підхід для вашого щільного графіка
          </h2>
          <p className="text-body text-fg-secondary">
            Працюєте допізна? Забронюйте приватний сеанс до 22:00 в атмосфері спокою та повної
            конфіденційності. Тільки ви, ваш майстер та абсолютна тиша центру Києва.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md"
          >
            Забронювати вечірній час &rarr;
          </Link>
          <Link
            href="/locations"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all"
          >
            Адреси студій
          </Link>
        </div>
      </div>
    </section>
  );
}
