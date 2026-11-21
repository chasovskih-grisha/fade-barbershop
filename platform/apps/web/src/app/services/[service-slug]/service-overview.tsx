'use client';

import type { Service } from '@/lib/api/catalog';
import { ServiceCover } from './ServiceCover';
import { ServiceTrustBadges } from './ServiceTrustBadges';
import { ServiceBookingCallout } from './ServiceBookingCallout';
import { ServiceBarbersList } from './ServiceBarbersList';
import { ServiceSlotsSection } from './ServiceSlotsSection';
import { ServiceFaqSection } from './ServiceFaqSection';
import { ServiceReviewsSection } from './ServiceReviewsSection';
import {
  FIXED_DATE,
  type Barbers,
  type Slots,
  type ServiceFaq,
  type ServiceReview,
} from './service-overview.types';

interface ServiceOverviewProps {
  service: Service;
  barbersResult: Barbers;
  slotsResult: Slots;
  faqs?: ServiceFaq[];
  reviews?: ServiceReview[];
}

export function ServiceOverview({
  service,
  barbersResult,
  slotsResult,
  faqs = [],
  reviews = [],
}: ServiceOverviewProps) {
  const bookingHref = (s?: { start: string; end: string }) =>
    `/booking?serviceId=${service.id}&date=${FIXED_DATE}${s ? `&start=${s.start}&end=${s.end}` : ''}`;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <section className="rounded-[var(--radius-card)] overflow-hidden bg-surface border border-line-strong shadow-2xl">
        {!service.coverImage && (
          <div className="p-8 pb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-fg text-xs font-semibold uppercase tracking-wider mb-2">
              Преміум сервіс
            </span>
            <h1 className="font-display text-4xl font-bold text-fg">{service.name}</h1>
            <span className="font-display text-2xl font-bold text-accent mt-2 block">
              {service.price} грн
            </span>
          </div>
        )}
        {service.coverImage && (
          <ServiceCover name={service.name} price={service.price} coverImage={service.coverImage} />
        )}
        <div className="p-8 space-y-6">
          <p className="text-h4 text-fg-secondary leading-relaxed">
            {service.description || 'Послуга barbershop Fade'}
          </p>
          <ServiceTrustBadges duration={service.duration} />
        </div>
      </section>

      <ServiceBookingCallout name={service.name} bookingHref={bookingHref} />

      <section className="rounded-card bg-surface-raised w-full p-8 border border-line">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-semibold text-fg">
              Майстри високої кваліфікації
            </h3>
            <p className="text-sm text-fg-secondary">
              Досвідчені фахівці FADE, які спеціалізуються на цій послузі
            </p>
          </div>
          <span className="text-xs text-accent bg-accent/10 px-3 py-1.5 rounded-full font-medium">
            Сертифіковані експерти
          </span>
        </div>
        <ServiceBarbersList result={barbersResult} />
      </section>

      <ServiceSlotsSection
        slotsResult={slotsResult}
        bookingHref={bookingHref}
        name={service.name}
        duration={service.duration}
      />

      {faqs.length > 0 && <ServiceFaqSection faqs={faqs} name={service.name} />}
      {reviews.length > 0 && <ServiceReviewsSection reviews={reviews} name={service.name} />}
    </div>
  );
}
