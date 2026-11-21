import type { Metadata } from 'next';
import { EmptyState } from '@fade/ui';
import { getServices } from '@/lib/api/catalog';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { ActionLink } from '@/app/components/ActionLink';
import { BOOKING_OPENS_SOON_TEXT } from '@/lib/booking-availability';
import { ServiceCard } from './ServiceCard';
import { ServicesStyleAdvisor } from './ServicesStyleAdvisor';
import { ServicesPricingCalculator } from './ServicesPricingCalculator';
import { ServicesPageHeader } from './ServicesPageHeader';
import { buildServicesJsonLd } from './services-json-ld';

export const metadata: Metadata = pageMetadata({
  title: 'Послуги та ціни — Fade Atelier',
  description:
    'Ексклюзивний прайс барбершопу Fade: чоловічі стрижки, моделювання бороди, догляд та фірмові ритуали. Онлайн-запис за 60 секунд.',
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
      <ServicesPageHeader />

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
        </>
      )}
    </div>
  );
}
