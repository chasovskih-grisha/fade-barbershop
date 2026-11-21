import Link from 'next/link';
import { PortfolioShowcaseCard } from './PortfolioShowcaseCard';
import { PORTFOLIO_SHOWCASE_ITEMS } from './portfolio-showcase-data';

export function HomePortfolioGallery() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface border border-line p-8 md:p-14 shadow-lg">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
              <span>✦ Портфоліо та Візуальна Галерея FADE</span>
            </div>
            <h2 className="text-h2 font-display font-bold text-fg">
              Архітектура деталей у кожному кадрі
            </h2>
            <p className="text-bodyLg text-fg-secondary">
              Перегляньте приклади наших робіт: бездоганні переходи (skin fade), чисті контури,
              моделювання бороди та преміальний стайлінг від топ-майстрів Fade з можливістю
              миттєвого бронювання слотів.
            </p>
          </div>
          <Link
            href="/barbers"
            className="inline-flex h-11 items-center justify-center rounded-input border border-line px-6 text-body font-semibold text-fg hover:bg-interactive transition-all w-fit"
          >
            Усі роботи та майстри &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PORTFOLIO_SHOWCASE_ITEMS.map((item, index) => (
            <PortfolioShowcaseCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
