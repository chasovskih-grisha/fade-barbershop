import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServices, getBarbersForService, getSlotsForService } from '@/lib/api/catalog';
import { pageMetadata } from '@/lib/metadata';
import { ServiceOverview } from './service-overview';
import { buildServiceFaqs, buildServiceReviews } from './service-content';
import { buildServiceJsonLd } from './service-json-ld';

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

  const faqs = buildServiceFaqs(service);
  const reviews = buildServiceReviews(service);
  const jsonLd = buildServiceJsonLd({ service, serviceSlug, faqs, reviews });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/services" className="text-sm text-fg-secondary hover:text-fg">
        &larr; Всі послуги
      </Link>
      <ServiceOverview
        service={service}
        barbersResult={barbersResult}
        slotsResult={slotsResult}
        faqs={faqs}
        reviews={reviews}
      />
    </div>
  );
}
