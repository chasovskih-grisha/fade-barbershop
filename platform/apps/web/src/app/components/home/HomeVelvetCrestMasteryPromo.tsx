import React from 'react';
import Link from 'next/link';

export function HomeVelvetCrestMasteryPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient border border-semantic-warning/40 p-8 md:p-12 shadow-2xl backdrop-blur-2xl group hover:border-semantic-warning transition-all duration-500">
      {/* Ambient gold & blue glow accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-semantic-warning/15 rounded-full blur-[120px] pointer-events-none group-hover:bg-semantic-warning/25 transition-all duration-700" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-accent-blue/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-semantic-warning/20 border border-semantic-warning/40 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-semantic-warning shadow-sm w-fit">
            <span>👑 Ексклюзивний пакет • FADE Velvet Crest Mastery</span>
          </div>
          <h2 className="text-h3 md:text-h2 font-display font-bold text-fg leading-tight">
            Комплекс «Velvet Crest»: преміальний догляд, стрижка бороди та масляний релакс-масаж
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Найвищий стандарт чоловічого догляду для тих, хто обирає неперевершену форму, мʼякий евкаліптовий компрес, індивідуальну роботу топ-барбера та повне занурення у затишок приватної студії на 2 крісла.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-fg-secondary">
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-semantic-warning text-base">✓</span> Персональний топ-майстер
            </span>
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-semantic-warning text-base">✓</span> Елітний бар та міцний еспресо
            </span>
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-semantic-warning text-base">✓</span> Гарантія форми 30 днів
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Записатися на Velvet Crest</span>
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </Link>
          <Link
            href="/services"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input border border-line-strong bg-interactive px-7 text-body font-medium text-fg hover:bg-interactive-hover hover:border-semantic-warning transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            Усі послуги
          </Link>
        </div>
      </div>
    </section>
  );
}
