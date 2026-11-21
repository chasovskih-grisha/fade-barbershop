import Link from 'next/link';
import { ServiceHighlightCard } from './ServiceHighlightCard';
import { SERVICE_HIGHLIGHTS } from './home-services-data';

export function HomeServices() {
  return (
    <section className="flex flex-col gap-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 border border-accent-blue/30 px-3.5 py-1.5 text-caption font-semibold uppercase text-accent-blue shadow-sm">
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-pulse"
              aria-hidden="true"
            />
            Сервіс & Прайс
          </div>
          <h2 className="font-display text-h3 md:text-h2 font-bold text-fg">
            Послуги найвищого стандарту
          </h2>
          <p className="text-bodyLg text-fg-secondary">
            Прозорі фіксовані ціни. Кожна послуга включає індивідуальну консультацію, підбір форми
            та фірмовий ритуал.
          </p>
        </div>
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-body font-semibold text-fg hover:text-accent-blue transition-colors group py-1"
        >
          Дивитися увесь прайс{' '}
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {SERVICE_HIGHLIGHTS.map((service) => (
          <ServiceHighlightCard key={service.title} service={service} />
        ))}
      </div>
    </section>
  );
}
