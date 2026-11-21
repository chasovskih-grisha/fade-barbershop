import React from 'react';
import Link from 'next/link';

export function HomeMembershipVIP() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-12 shadow-md">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
            <span>👑 Клубна програма FADE VIP</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Безлімітні стрижки та пріоритетний запис 24/7 для членів клубу
          </h2>
          <p className="text-body text-fg-secondary">
            Отримайте повний спектр догляду без обмежень: персональний графік у зручний час,
            закріплений топ-майстер, преміальна косметика для домашнього догляду в подарунок
            щомісяця та доступ до закритих подій студії.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-caption font-medium text-fg-secondary">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-blue" />
              <span>Фіксований час без очікування</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-blue" />
              <span>Знижка 20% на всю косметику</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-blue" />
              <span>Консьєрж-сервіс</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto">
          <Link
            href="/account"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md text-center"
          >
            Оформити VIP-статус &rarr;
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 w-full sm:w-auto lg:w-64 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all text-center"
          >
            Дізнатися деталі клубу
          </Link>
        </div>
      </div>
    </section>
  );
}
