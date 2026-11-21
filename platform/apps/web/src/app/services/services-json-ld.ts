import type { Service } from '@/lib/api/catalog';

/** ItemList structured data for the public price list. */
export function buildServicesJsonLd(services: Service[]) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.description || 'Послуга barbershop Fade',
        provider: { '@type': 'HairSalon', name: 'FADE Barbershop', url: siteUrl },
        offers: {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: 'UAH',
          url: `${siteUrl}/services/${service.id}`,
        },
      },
    })),
  };
}
