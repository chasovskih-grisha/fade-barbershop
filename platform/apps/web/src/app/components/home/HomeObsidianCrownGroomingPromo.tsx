import React from 'react';
import Link from 'next/link';

export function HomeObsidianCrownGroomingPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient border border-semantic-warning/40 p-8 md:p-12 shadow-2xl backdrop-blur-2xl group hover:border-semantic-warning transition-all duration-500">
      {/* Ambient gold & blue glow accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-semantic-warning/15 rounded-full blur-[120px] pointer-events-none group-hover:bg-semantic-warning/25 transition-all duration-700" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-accent-blue/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-semantic-warning/20 border border-semantic-warning/40 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-semantic-warning shadow-sm w-fit">
            <span>💎 Елітний пакет • FADE Obsidian Crown</span>
          </div>
          <h2 className="text-h3 md:text-h2 font-display font-bold text-fg leading-tight">
            Ритуал «Obsidian Crown»: преміум стрижка, авторський стайлінг та догляд за обличчям
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Максимальний рівень сервісу для тих, хто цінує кожну хвилину і бездоганний зовнішній вигляд. Професійний підхід топ-майстра, преміальна чоловіча косметика та абсолютний спокій у приватному просторі FADE.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-fg-secondary">
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-semantic-warning text-base">✓</span> Індивідуальний консьєрж-сервіс
            </span>
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-semantic-warning text-base">✓</span> Ароматерапія гарячими рушниками
            </span>
            <span className="flex items-center gap-2 font-medium text-fg">
              <span className="text-semantic-warning text-base">✓</span> Пріоритетне бронювання 24/7
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Забронювати Obsidian Crown</span>
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
