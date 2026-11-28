import type { Metadata } from 'next';
import { EmptyState } from '@fade/ui';
import { getServices } from '@/lib/api/catalog';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { ActionLink } from '@/app/components/ActionLink';
import { Button } from '@fade/ui';
import { BOOKING_OPENS_SOON_TEXT } from '@/lib/booking-availability';
import { ServiceCard } from './ServiceCard';
import { ServicesStyleAdvisor } from './ServicesStyleAdvisor';
import { ServicesPricingCalculator } from './ServicesPricingCalculator';
import { ServicesPageHeader } from './ServicesPageHeader';
import { buildServicesJsonLd } from './services-json-ld';

export const metadata: Metadata = pageMetadata({
  title: 'Послуги — Fade Atelier',
  description:
    'Меню послуг барбершопу Fade: чоловічі стрижки, моделювання бороди, догляд та фірмові ритуали.',
  path: '/services',
});

export default async function ServicesPage() {
  const result = await getServices();
  const jsonLd = result.state === 'ok' ? buildServicesJsonLd(result.data) : null;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {result.state !== 'empty' && <ServicesPageHeader />}

      {result.state === 'empty' && (
        <header className="flex flex-col gap-4 border-b border-line pb-8">
          <h1 className="font-display text-h1 font-bold text-fg">Послуги</h1>
          <p className="max-w-3xl text-bodyLg text-fg-secondary">
            Меню послуг і ціни зʼявляться разом із першою студією.
          </p>
        </header>
      )}

      {result.state === 'error' && <ErrorState message={result.message} />}

      {result.state === 'empty' && (
        <EmptyState
          title="Послуг ще немає"
          description={BOOKING_OPENS_SOON_TEXT}
          action={
            <ActionLink href="/" variant="secondary" className="mt-2">
              На головну
            </ActionLink>
          }
        />
      )}

      {result.state === 'ok' && (
        <>
          <ServicesStyleAdvisor services={result.data} />
          <ServicesPricingCalculator services={result.data} />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {result.data.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

      {/* T-250: CTA section for service signup */}
      <div className="rounded-card rounded-card border border-line p-8 pt-12">
        <div className="max-w-xl">
          <h2 className="font-display text-h3 font-bold text-fg mb-4">Забронювати стрижку</h2>
          <p className="text-body text-fg-secondary mb-6">Обери послугу та час, який тобі підходить</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {['fade-clipper', 'fade-beard', 'fade-child'].map((style) => (
              <div key={style} className="p-4 border border-line rounded-input hover:border-accent transition-colors">
                <h3 className="font-text text-h4 font-semibold">{style.replace('-', ' ')}</h3>
                <p className="text-sm text-fg-secondary">{style.replace('-', ' ')} — {style.split('-')[1]}</p>
                <Button href="/services/{style}" variant="primary">Забронювати</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
