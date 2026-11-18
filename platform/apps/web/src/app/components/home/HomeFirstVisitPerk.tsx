import React from 'react';
import Link from 'next/link';

export function HomeFirstVisitPerk() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-10 shadow-lg">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
            <span>✨ Привілей першого візиту</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Перший візит у FADE? Отримайте персональну консультацію та ритуал в подарунок
          </h2>
          <p className="text-body text-fg-secondary">
            Кожна перша стрижка супроводжується індивідуальним підбором геометрії під форму обличчя, консультацією щодо домашнього догляду за бородою чи волоссям та фірмовим напоєм студії.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md"
          >
            Записатися з бонусом &rarr;
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
