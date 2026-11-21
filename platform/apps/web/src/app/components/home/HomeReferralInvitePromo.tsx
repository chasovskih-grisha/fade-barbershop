import React from 'react';
import Link from 'next/link';

export function HomeReferralInvitePromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-12 shadow-md">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
            <span>🤝 Реферальна програма FADE</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Запрошуйте друзів — отримуйте по 150 ₴ бонусів на кожен візит
          </h2>
          <p className="text-body text-fg-secondary">
            Поділіться своїм персональним промокодом із друзями. Ваш друг отримає привілей на першу
            стрижку, а після завершення візиту на ваш рахунок автоматично нарахуються бонусні
            гривні.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-input bg-surface-sunken/60 border border-line/65">
              <span className="text-body font-bold text-accent-blue">🎁</span>
              <div>
                <h4 className="text-body font-semibold text-fg">Другу — знижка</h4>
                <p className="text-caption text-fg-secondary">Спеціальна пропозиція на запис</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-input bg-surface-sunken/60 border border-line/65">
              <span className="text-body font-bold text-accent-blue">⚡</span>
              <div>
                <h4 className="text-body font-semibold text-fg">Вам — 150 ₴</h4>
                <p className="text-caption text-fg-secondary">На бонусний баланс</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto">
          <Link
            href="/account/referrals"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md text-center"
          >
            Отримати мій код &rarr;
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all text-center"
          >
            Записатися на стрижку
          </Link>
        </div>
      </div>
    </section>
  );
}
