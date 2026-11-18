import Link from 'next/link';
import { ActionLink } from '@/app/components/ActionLink';
import { BarberPortrait } from '../BarberPortrait';
import { BarberProfileFacts } from './BarberProfileFacts';
import { BarberGalleryPlaceholder, BarberReviewsPlaceholder } from './BarberSections';
import type { Barber } from '@/lib/api/staff';

export function BarberDetailContent({ barber }: { barber: Barber }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

  // booking-flow.md:114: рейтинг і відгуки не показуються до публічних відгуків
  // (T-240), тому в розмітці немає ні aggregateRating, ні вигаданих Review.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: barber.name,
        jobTitle: barber.role || 'Майстер-барбер',
        ...(barber.bio ? { description: barber.bio } : {}),
        ...(barber.specialties && barber.specialties.length > 0
          ? { knowsAbout: barber.specialties }
          : {}),
        worksFor: {
          '@type': 'HairSalon',
          name: 'FADE Barbershop',
          url: siteUrl,
        },
        ...(barber.photoUrl ? { image: barber.photoUrl } : {}),
        url: `${siteUrl}/barbers/${barber.slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Головна', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Майстри', item: `${siteUrl}/barbers` },
          {
            '@type': 'ListItem',
            position: 3,
            name: barber.name,
            item: `${siteUrl}/barbers/${barber.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header>
        <Link href="/barbers" className="text-sm text-fg-secondary hover:text-fg">
          &larr; Усі майстри
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <BarberPortrait
          name={barber.name}
          photoUrl={barber.photoUrl}
          sizes="(max-width: 768px) 100vw, 400px"
          className="rounded-card"
        />

        <div className="md:col-span-2 flex flex-col gap-6">
          <div>
            <span className="text-xs uppercase text-accent font-semibold">{barber.role}</span>
            <h1 className="font-display text-h2 mt-1">{barber.name}</h1>
            {barber.bio && <p className="text-bodyLg text-fg-secondary mt-2">{barber.bio}</p>}
          </div>

          <BarberProfileFacts barber={barber} />

          <BarberGalleryPlaceholder name={barber.name} />

          <BarberReviewsPlaceholder />

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <ActionLink href={`/booking?barber=${barber.id}`} className="w-full sm:w-auto">
              Записатися до майстра
            </ActionLink>
            <Link
              href="/services"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-input border border-line px-6 font-text text-body font-medium text-fg hover:bg-interactive transition-colors"
            >
              Переглянути послуги та ціни
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
