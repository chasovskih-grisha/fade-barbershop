import Link from 'next/link';
import { Card } from '@fade/ui';
import type { ServiceHighlight } from './home-services-data';

const REGULAR_CARD =
  'flex flex-col justify-between p-7 fade-card-gradient border border-line shadow-md hover:border-accent-blue/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group';
const FEATURED_CARD =
  'flex flex-col justify-between p-7 fade-card-gradient border-2 border-accent-blue/60 shadow-xl relative hover:border-accent-blue hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group';
const REGULAR_CTA =
  'mt-8 inline-flex h-12 items-center justify-center rounded-input border border-line bg-interactive px-5 text-body font-semibold text-fg hover:bg-accent hover:text-accent-fg hover:border-accent transition-all shadow-sm';
const FEATURED_CTA =
  'mt-8 inline-flex h-12 items-center justify-center rounded-input bg-accent px-5 text-body font-bold text-accent-fg hover:opacity-95 transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99]';

export function ServiceHighlightCard({ service }: { service: ServiceHighlight }) {
  const featured = Boolean(service.featured);
  return (
    <Card className={featured ? FEATURED_CARD : REGULAR_CARD}>
      {featured && (
        <div className="absolute top-0 right-0 bg-accent-blue text-accent-fg text-[11px] font-bold uppercase px-3.5 py-1.5 rounded-bl-xl shadow-md">
          ✦ Хіт сезону
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className={`flex items-start justify-between${featured ? ' pr-8' : ''}`}>
          <div>
            <span
              className={`text-caption font-bold uppercase ${featured ? 'text-accent-blue' : 'text-fg-muted'}`}
            >
              {service.duration}
            </span>
            <h3 className="text-bodyLg font-display font-bold text-fg mt-1.5 group-hover:text-accent-blue transition-colors">
              {service.title}
            </h3>
          </div>
          <span
            className={`text-h4 font-display font-extrabold ${featured ? 'text-accent-blue' : 'text-fg'}`}
          >
            {service.price}
          </span>
        </div>
        <p className="text-body text-fg-secondary">{service.description}</p>
      </div>
      <Link href="/booking" className={featured ? FEATURED_CTA : REGULAR_CTA}>
        {service.cta}
      </Link>
    </Card>
  );
}
