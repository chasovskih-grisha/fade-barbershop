import React from 'react';
import Link from 'next/link';

export function HomeBrandLegacyGuarantee() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-12 shadow-md">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent w-fit">
            <span>✨ FADE Brand Impact &amp; Гарантія Якості</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Безкомпромісна точність та бездоганний стиль у кожній деталі
          </h2>
          <p className="text-body text-fg-secondary">
            Ми поєднуємо класичні традиції барберінгу з сучасними стандартами високої моди. Кожна стрижка — це індивідуальна архітектура форми, створена під ваш стиль життя з гарантією бездоганного результату.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-interactive/50 border border-line/50">
              <span className="text-h4 font-display font-bold text-fg">100%</span>
              <span className="text-caption text-fg-secondary">Гарантія симетрії та форми</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-interactive/50 border border-line/50">
              <span className="text-h4 font-display font-bold text-fg">60 сек</span>
              <span className="text-caption text-fg-secondary">Миттєвий онлайн-запис</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-interactive/50 border border-line/50">
              <span className="text-h4 font-display font-bold text-fg">24/7</span>
              <span className="text-caption text-fg-secondary">Клубна підтримка &amp; сервіс</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md text-center"
          >
            Записатися на стрижку &rarr;
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all text-center"
          >
            Переглянути послуги
          </Link>
        </div>
      </div>
    </section>
  );
}
