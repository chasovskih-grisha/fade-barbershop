import React from 'react';
import Link from 'next/link';

export function HomeSeasonalConcierge() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-raised border border-line p-8 md:p-12 shadow-lg">
      {/* Ambient background glow */}
      <div className="absolute right-0 top-0 w-72 h-72 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-accent-blue w-fit">
            <span>🛡️ Сезонний консьєрж стилю та гарантія FADE</span>
          </div>
          <h2 className="text-h3 md:text-h2 font-display font-bold text-fg leading-tight">
            Індивідуальний підбір стилю під сезон і бездоганна якість
          </h2>
          <p className="text-body text-fg-secondary">
            Змініть свій образ під новий сезон з персональною консультацією нашого топ-майстра. Ми враховуємо тренди, особливості форми голови, стиль життя та щільність бороди, забезпечуючи ідеальний результат із гарантією збереження форми на 3 тижні.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-[var(--radius-card)] bg-surface-sunken border border-line">
              <span className="text-accent-blue font-bold">✓</span>
              <div>
                <h4 className="font-display font-semibold text-fg text-sm">Гарантія форми 21 день</h4>
                <p className="text-caption text-fg-secondary">Коригування довжини бакенбардів та окантовки безкоштовно.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-[var(--radius-card)] bg-surface-sunken border border-line">
              <span className="text-accent-blue font-bold">✓</span>
              <div>
                <h4 className="font-display font-semibold text-fg text-sm">Експрес-запис за 60 секунд</h4>
                <p className="text-caption text-fg-secondary">Миттєвий вибір майстра, студії та зручного часу онлайн.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col items-stretch justify-center gap-4 p-6 rounded-[var(--radius-card)] bg-surface-sunken border border-line shadow-inner">
          <div className="space-y-2 text-center lg:text-left">
            <span className="text-caption font-semibold uppercase text-accent-blue tracking-wider">
              Спеціальна пропозиція місяця
            </span>
            <h3 className="text-h4 font-display font-semibold text-fg">
              Комплекс «Стрижка + Борода + Догляд»
            </h3>
            <p className="text-body text-fg-secondary">
              Заощаджуйте 20% при бронюванні комплексного ритуалу з укладанням та ароматерапією гарячим рушником.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/booking"
              className="inline-flex h-12 items-center justify-center rounded-input bg-accent px-6 text-body font-semibold text-accent-fg hover:opacity-90 transition-all shadow-md text-center"
            >
              Забронювати комплекс зі знижкою &rarr;
            </Link>
            <Link
              href="/services"
              className="inline-flex h-12 items-center justify-center rounded-input border border-line px-6 text-body font-medium text-fg hover:bg-interactive transition-all text-center"
            >
              Усі послуги та ціни
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
