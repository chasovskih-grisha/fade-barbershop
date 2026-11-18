import Link from 'next/link';
import { EmptyState } from '@fade/ui';
import type { Metadata } from 'next';
import { getServices } from '@/lib/api/catalog';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { ActionLink } from '@/app/components/ActionLink';
import { BOOKING_OPENS_SOON_TEXT } from '@/lib/booking-availability';
import { ServiceCard } from './ServiceCard';
import { ServicesStyleAdvisor } from './ServicesStyleAdvisor';
import { ServicesPricingCalculator } from './ServicesPricingCalculator';

export const metadata: Metadata = pageMetadata({
  title: 'Послуги та ціни — Fade Atelier',
  description: 'Ексклюзивний прайс барбершопу Fade: чоловічі стрижки, моделювання бороди, догляд та фірмові ритуали. Онлайн-запис за 60 секунд.',
  path: '/services',
});

export default async function ServicesPage() {
  const result = await getServices();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';
  const jsonLd =
    result.state === 'ok'
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: result.data.map((service, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Service',
              name: service.name,
              description: service.description || 'Послуга barbershop Fade',
              provider: {
                '@type': 'HairSalon',
                name: 'FADE Barbershop',
                url: siteUrl,
              },
              offers: {
                '@type': 'Offer',
                price: service.price,
                priceCurrency: 'UAH',
                url: `${siteUrl}/services/${service.id}`,
              },
            },
          })),
        }
      : null;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <header className="flex flex-col gap-6 border-b border-line pb-12 relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient p-8 md:p-14 shadow-xl border-line-strong/60">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />
        <Link href="/" className="text-body text-fg-secondary hover:text-fg w-fit transition-colors flex items-center gap-2 relative z-10">
          &larr; На головну
        </Link>
        <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4.5 py-2 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm relative z-10">
          ✦ Архітектурне меню та ритуали FADE
        </div>
        <h1 className="font-display text-[2.75rem] md:text-[3.5rem] font-bold text-fg leading-none relative z-10">
          Послуги та фіксований прайс
        </h1>
        <p className="max-w-3xl text-bodyLg text-fg-secondary relative z-10">
          Прозорий прайс без прихованих доплат і поспіху. У кожну класичну стрижку входять детальне консультування, миття голови професійною косметикою, стайлінг та фірмовий ритуал гарячого рушника.
        </p>

        {/* Категорії сервісів */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 relative z-10">
          <span className="inline-flex items-center rounded-pill bg-accent text-accent-fg px-4 py-2 text-caption font-semibold shadow-sm">
            Усі послуги
          </span>
          <span className="inline-flex items-center rounded-pill bg-surface-sunken border border-line text-fg-secondary hover:text-fg px-4 py-2 text-caption font-medium transition-colors cursor-pointer">
            Класичні стрижки
          </span>
          <span className="inline-flex items-center rounded-pill bg-surface-sunken border border-line text-fg-secondary hover:text-fg px-4 py-2 text-caption font-medium transition-colors cursor-pointer">
            Моделювання бороди
          </span>
          <span className="inline-flex items-center rounded-pill bg-surface-sunken border border-line text-fg-secondary hover:text-fg px-4 py-2 text-caption font-medium transition-colors cursor-pointer">
            Комплексні ритуали
          </span>
        </div>

        {/* Промо першого візиту */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-card border-2 border-accent-blue/40 bg-surface-sunken p-8 shadow-xl backdrop-blur-md relative z-10">
          <div className="flex flex-col gap-2">
            <span className="text-bodyLg font-display font-bold text-fg">Спеціальна пропозиція для нових гостей</span>
            <span className="text-body text-fg-secondary">Знижка -100 ₴ на першу чоловічу стрижку при онлайн-записі в будь-яку студію мережі Fade</span>
          </div>
          <Link
            href="/booking"
            className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 w-fit shrink-0 transition-all shadow-lg hover:scale-[1.02]"
          >
            Скористатися знижкою &rarr;
          </Link>
        </div>
      </header>

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
