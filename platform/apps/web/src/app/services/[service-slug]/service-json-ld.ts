import type { Service } from '@/lib/api/catalog';
import type { ServiceFaq, ServiceReview } from './service-content';

interface ServiceJsonLdInput {
  service: Service;
  serviceSlug: string;
  faqs: ServiceFaq[];
  reviews: ServiceReview[];
}

/** Service + FAQ + breadcrumb JSON-LD block. */
export function buildServiceJsonLd({ service, serviceSlug, faqs, reviews }: ServiceJsonLdInput) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: service.name,
        description: service.description || 'Послуга barbershop Fade',
        serviceType: 'Barbering Services',
        provider: { '@type': 'HairSalon', name: 'FADE Barbershop', url: siteUrl },
        offers: {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: 'UAH',
          url: `${siteUrl}/services/${serviceSlug}`,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '120',
          bestRating: '5',
          worstRating: '1',
        },
        review: reviews.map((r) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.author },
          datePublished: r.datePublished,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: r.reviewRating.ratingValue,
            bestRating: r.reviewRating.bestRating,
          },
          reviewBody: r.reviewBody,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Головна', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Послуги', item: `${siteUrl}/services` },
          {
            '@type': 'ListItem',
            position: 3,
            name: service.name,
            item: `${siteUrl}/services/${serviceSlug}`,
          },
        ],
      },
    ],
  };
}
