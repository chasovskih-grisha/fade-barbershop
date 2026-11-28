import type { Barber } from '@/lib/api/staff';

// schema.org Person/HairSalon (T-4477a) винесено з розмітки (T-4860):
// одноколонковий профіль став довшим за ліміт файлу, а розмітка не залежить
// від порядку регіонів. Рейтингу немає — booking-flow.md:114.
export function BarberStructuredData({ barber }: { barber: Barber }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}