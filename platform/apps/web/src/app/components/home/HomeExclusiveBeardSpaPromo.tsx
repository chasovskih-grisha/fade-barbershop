import React from 'react';
import Link from 'next/link';

export function HomeExclusiveBeardSpaPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-12 shadow-md">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-56 bg-semantic-warning/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-semantic-warning/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-semantic-warning dark:text-semantic-warning w-fit">
            <span>✨ Преміум Догляд та Спа</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Ексклюзивний спа-ритуал для бороди та обличчя з гарячими рушниками
          </h2>
          <p className="text-body text-fg-secondary">
            Повний комплекс глибокого очищення, пом&apos;якшення та моделювання бороди.
            Використовуємо ефірні олії евкаліпта, озоновані гарячі рушники та професійний масаж для
            повного розслаблення.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-caption font-medium text-fg-secondary">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-semantic-warning" />
              <span>Озонові гарячі компреси</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-semantic-warning" />
              <span>Преміум олії з Європи</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-semantic-warning" />
              <span>Релакс-масаж обличчя</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md text-center"
          >
            Записатися на Спа &rarr;
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all text-center"
          >
            Усі послуги та ціни
          </Link>
        </div>
      </div>
    </section>
  );
}
