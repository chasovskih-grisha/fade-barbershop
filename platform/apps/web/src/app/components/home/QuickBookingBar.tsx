import React from 'react';
import Link from 'next/link';
import { Card } from '@fade/ui';

export function QuickBookingBar() {
  return (
    <Card className="p-6 md:p-10 bg-surface/95 border border-line-strong shadow-2xl relative z-25 -mt-12 md:-mt-20 mx-4 md:mx-12 rounded-[var(--radius-card)] backdrop-blur-2xl hover:border-accent-blue/80 transition-all duration-500 group">
      {/* Absolute atmospheric glow */}
      <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-blue/25 transition-all duration-700" />
      <div className="absolute -right-20 -top-20 w-48 h-48 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2.5 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-3.5 py-1.5 text-caption font-semibold uppercase text-accent-blue tracking-wider shadow-sm">
            <span
              className="h-2 w-2 rounded-full bg-accent-blue animate-pulse"
              aria-hidden="true"
            />
            ⚡ Швидкий запис • 3 вікна на сьогодні
          </div>
          <h3 className="text-h3 md:text-h2 font-display font-bold text-fg tracking-wider">
            Оберіть послугу та забронюйте вікно
          </h3>
          <p className="text-bodyLg text-fg-secondary max-w-xl">
            Перший візит зі знижкою 100 ₴. Вхід за телефоном та SMS OTP без зайвих акаунтів і
            паролів за 60 секунд.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 shrink-0">
          <Link
            href="/booking?service=haircut"
            className="inline-flex h-13 items-center justify-center rounded-input border border-line-strong bg-interactive px-5 text-body font-semibold text-fg hover:bg-interactive-hover hover:border-accent-blue transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            aria-label="Записатися на чоловічу стрижку"
          >
            ✂️ Чоловіча стрижка (600 ₴)
          </Link>
          <Link
            href="/booking?service=complex"
            className="inline-flex h-13 items-center justify-center rounded-input border border-line-strong bg-interactive px-5 text-body font-semibold text-fg hover:bg-interactive-hover hover:border-accent-blue transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            aria-label="Записатися на комплекс FADE"
          >
            🔥 Комплекс (Стрижка + Борода)
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-95 transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue relative overflow-hidden group/cta"
            aria-label="Обрати вільний час у розкладі"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span>Обрати час</span>
              <span className="transition-transform duration-300 group-hover/cta:translate-x-1">
                &rarr;
              </span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
