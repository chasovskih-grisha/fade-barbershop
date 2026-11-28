import { EmptyState } from '@fade/ui';
import type { Metadata } from 'next';
import { getBarbersByStudio } from '@/lib/api/studio-directory';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { ActionLink } from '@/app/components/ActionLink';
import { BOOKING_OPENS_SOON_TEXT } from '@/lib/booking-availability';
import { BarbersClient } from './BarbersClient';

// T-4854: опис маршруту обіцяв портфоліо, ціни та вільні вікна, яких немає в
// даних. Лишається те, що сторінка справді показує — команда студії та профілі.
export const metadata: Metadata = pageMetadata({
  title: 'Майстри — Fade Atelier',
  description: 'Майстри Fade: команда студії та профілі майстрів.',
  path: '/barbers',
});

export default async function BarbersPage() {
  // T-4852a: спершу кожна активна студія, потім її люди — довідник більше не
  // показує ростер першої локації під назвою мережі.
  const result = await getBarbersByStudio();
  // Пошук і фільтри живе в BarbersClient: це клієнтський компонент, а серверний
  // компонент не може тримати стан (T-4857a).
  const everyone = result.state === 'ok' ? result.data.flatMap((studio) => studio.barbers) : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';
  const jsonLd =
    result.state === 'ok'
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: everyone.map((barber, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Person',
              name: barber.name,
              jobTitle: barber.role || 'Майстер-барбер',
              url: `${siteUrl}/barbers/${barber.slug}`,
              image: barber.photoUrl ?? undefined,
              worksFor: {
                '@type': 'HairSalon',
                name: 'FADE Barbershop',
                url: siteUrl,
              },
            },
          })),
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {result.state === 'error' && (
        <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
          <ErrorState message={result.message} />
        </div>
      )}

      {result.state === 'empty' && (
        <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
          <EmptyState
            title="Команда ще формується"
            description={BOOKING_OPENS_SOON_TEXT}
            action={
              <ActionLink href="/" variant="secondary" className="mt-2">
                На головну
              </ActionLink>
            }
          />
        </div>
      )}

      {result.state === 'ok' && <BarbersClient studios={result.data} />}
    </>
  );
}
