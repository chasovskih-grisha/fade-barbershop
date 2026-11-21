import React from 'react';
import Link from 'next/link';

export function HomePrivateLoungePromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-r from-surface via-interactive to-surface border border-line p-8 md:p-10 shadow-lg">
      {/* Ambient background glow */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent w-fit">
            <span>🥃 Приватний формат • 2 крісла</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Жодних черг і сторонніх: камерний простір, авторська кава та повна конфедійність
          </h2>
          <p className="text-body text-fg-secondary">
            Fade — це не потоковий салон, а затишний приватний барбершоп на два крісла в центрі
            Києва. Тільки ви, ваш майстер, улюблена музика, витриманий еспресо чи крафтові напої та
            бездоганна увага до деталей.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md"
          >
            Забронювати візит &rarr;
          </Link>
          <Link
            href="/locations"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all"
          >
            Наші студії
          </Link>
        </div>
      </div>
    </section>
  );
}
