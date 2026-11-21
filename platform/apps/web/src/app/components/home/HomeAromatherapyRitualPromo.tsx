import React from 'react';
import Link from 'next/link';

export function HomeAromatherapyRitualPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient border border-line-strong p-8 md:p-10 shadow-2xl backdrop-blur-2xl group hover:border-accent-blue/60 transition-all duration-500">
      {/* Ambient atmospheric glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-blue/25 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit shadow-sm">
            <span>✨ Ароматерапевтичний ритуал • Новинка</span>
          </div>
          <h2 className="text-h3 font-display font-bold text-fg tracking-wider">
            Елітний ароматерапевтичний ритуал гарячого рушника та ефірних олій
          </h2>
          <p className="text-bodyLg text-fg-secondary leading-relaxed">
            Пориньте у стан глибокого релаксу перед початком стрижки. Традиційні компреси з
            натуральними екстрактами евкаліпту та кедра знімають напругу та підготують шкіру до
            ідеального гоління.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Записатися на ритуал</span>
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
          <Link
            href="/services"
            className="inline-flex h-13 w-full sm:w-auto items-center justify-center rounded-input border border-line-strong bg-interactive px-7 text-body font-medium text-fg hover:bg-interactive-hover hover:border-accent-blue transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            Усі послуги
          </Link>
        </div>
      </div>
    </section>
  );
}
