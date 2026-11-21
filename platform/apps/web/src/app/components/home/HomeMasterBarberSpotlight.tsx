import React from 'react';
import Link from 'next/link';

export function HomeMasterBarberSpotlight() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-12 shadow-md">
      {/* Subtle ambient lighting */}
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent w-fit">
            <span>✨ Топ-майстри FADE</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Персональний підхід від провідних барберів Києва
          </h2>
          <p className="text-body text-fg-secondary">
            Кожна стрижка та гоління у Fade — це ретельна робота з формою черепа, структурою волосся
            та вашим щоденним стилем. Наші майстри мають понад 7 років досвіду в преміальних студіях
            та проходять регулярну міжнародну сертифікацію.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-input bg-surface-sunken/60 border border-line/60">
              <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
              <div>
                <h4 className="text-body font-semibold text-fg">Денис • Старший майстер</h4>
                <p className="text-caption text-fg-secondary">
                  Експерт з класичних форм, текстурних стрижок та безпечного гоління небезпечною
                  бритвою.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-input bg-surface-sunken/60 border border-line/60">
              <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
              <div>
                <h4 className="text-body font-semibold text-fg">Артем • Топ-стиліст</h4>
                <p className="text-caption text-fg-secondary">
                  Спеціаліст з кроп-стрижок, fades, бороди та складних переходів.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto">
          <Link
            href="/barbers"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md text-center"
          >
            Обрати майстра &rarr;
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all text-center"
          >
            Записатися онлайн
          </Link>
        </div>
      </div>
    </section>
  );
}
