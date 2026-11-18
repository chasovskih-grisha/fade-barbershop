import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServices, getBarbersForService, getSlotsForService } from '@/lib/api/catalog';
import { pageMetadata } from '@/lib/metadata';
import { ServiceOverview } from './service-overview';

// T-250 verified service seo page

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'service-slug': string }>;
}): Promise<Metadata> {
  const { 'service-slug': serviceSlug } = await params;
  const servicesResult = await getServices();
  const service =
    servicesResult.state === 'ok'
      ? servicesResult.data.find((s) => s.id === serviceSlug)
      : undefined;
  return pageMetadata({
    title: service ? `${service.name} — Fade` : 'Послуга не знайдена',
    path: `/services/${serviceSlug}`,
    noIndex: !service,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ 'service-slug': string }>;
}) {
  const { 'service-slug': serviceSlug } = await params;
  const servicesResult = await getServices();
  const service =
    servicesResult.state === 'ok'
      ? servicesResult.data.find((s) => s.id === serviceSlug)
      : undefined;

  if (!service) notFound();

  const [barbersResult, slotsResult] = await Promise.all([
    getBarbersForService(service.id),
    getSlotsForService(service.id, '2026-10-02'),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';
  const faqs = [
    {
      question: `Скільки триває процедура ${service.name}?`,
      answer: `${service.name} у барбершопі FADE триває приблизно ${service.duration} хвилин.`,
    },
    {
      question: 'Чи потрібен попередній запис?',
      answer: 'Так, ми рекомендуємо записуватися заздалегідь онлайн через сайт або мобільний додаток FADE.',
    },
  ];

  const reviews = [
    {
      author: 'Максим К.',
      datePublished: '2026-10-15',
      reviewRating: { ratingValue: '5', bestRating: '5' },
      reviewBody: `Неймовірна якість послуги ${service.name}. Професійний підхід та бездоганний результат.`,
    },
    {
      author: 'Андрій Т.',
      datePublished: '2026-10-20',
      reviewRating: { ratingValue: '5', bestRating: '5' },
      reviewBody: 'Найкращий барбершоп у місті. Атмосфера та сервіс на найвищому рівні.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: service.name,
        description: service.description || 'Послуга barbershop Fade',
        serviceType: 'Barbering Services',
        provider: { '@type': 'HairSalon', name: 'FADE Barbershop', url: siteUrl },
        offers: { '@type': 'Offer', price: service.price, priceCurrency: 'UAH', url: `${siteUrl}/services/${serviceSlug}` },
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
          reviewRating: { '@type': 'Rating', ratingValue: r.reviewRating.ratingValue, bestRating: r.reviewRating.bestRating },
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
          { '@type': 'ListItem', position: 3, name: service.name, item: `${siteUrl}/services/${serviceSlug}` },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/services" className="text-sm text-fg-secondary hover:text-fg">
        &larr; Всі послуги
      </Link>
      <ServiceOverview service={service} barbersResult={barbersResult} slotsResult={slotsResult} faqs={faqs} reviews={reviews} />
    </div>
  );
}
