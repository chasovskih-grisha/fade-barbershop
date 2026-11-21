import Link from 'next/link';
import { CraftsmanshipPrincipleItem } from './CraftsmanshipPrincipleItem';
import { CraftsmanshipConceptCard } from './CraftsmanshipConceptCard';
import { CRAFTSMANSHIP_PRINCIPLES } from './craftsmanship-data';

export function HomeCraftsmanship() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-raised border border-line p-8 md:p-16 shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-80 h-80 bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-surface-sunken/80 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 border border-accent-blue/30 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
            ✦ Фірмовий Стандарт FADE • Архітектура та Стиль
          </div>
          <h2 className="font-display text-h2 md:text-h1 font-bold text-fg leading-[1.1]">
            Прибрати зайве. <br />
            <span className="fade-gradient-text">Залишити форму.</span>
          </h2>
          <p className="text-bodyLg text-fg-secondary">
            У світі, перенасиченому шумом, справжня розкіш — це точність і тиша. Наша студія на два
            крісла у центрі Києва створена для тих, хто цінує бездоганну геометрію стрижки та
            особистий час.
          </p>
          <div className="space-y-4 pt-2">
            {CRAFTSMANSHIP_PRINCIPLES.map((principle) => (
              <CraftsmanshipPrincipleItem key={principle.number} principle={principle} />
            ))}
          </div>
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              href="/booking"
              className="inline-flex h-12 items-center justify-center rounded-input bg-accent px-7 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-md"
            >
              Забронювати сеанс &rarr;
            </Link>
            <Link
              href="/services"
              className="inline-flex h-12 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all"
            >
              Переглянути послуги
            </Link>
          </div>
        </div>

        <CraftsmanshipConceptCard />
      </div>
    </section>
  );
}
