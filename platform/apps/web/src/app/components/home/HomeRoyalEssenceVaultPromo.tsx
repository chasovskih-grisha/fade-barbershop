import React from 'react';
import Link from 'next/link';

export function HomeRoyalEssenceVaultPromo() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-surface via-interactive to-surface border border-line p-8 md:p-10 shadow-lg">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent w-fit">
            <span>✨ Royal Essence Vault • Ексклюзивний архів</span>
          </div>
          <h2 className="text-h3 font-display font-semibold text-fg">
            Колекція «Royal Essence Vault»: рідкісні парфумовані олії та еліксири бороди
          </h2>
          <p className="text-body text-fg-secondary">
            Відкрийте для себе лімітовану серію преміальних доглядових засобів ручної роботи з нотами тютюнового листя, амбри та витриманого дерева. Доступно для замовлення у студії та під час онлайн-запису.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <Link
            href="/booking"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-md"
          >
            Забронювати з Vault &rarr;
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all"
          >
            Дізнатися більше
          </Link>
        </div>
      </div>
    </section>
  );
}
