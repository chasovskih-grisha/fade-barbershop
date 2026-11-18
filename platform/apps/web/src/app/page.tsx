import Link from 'next/link';
import { Card } from '@fade/ui';
import type { Metadata } from 'next';
import { getLocations } from '@/lib/api/locations';
import { pageMetadata } from '@/lib/metadata';
import { BlogTeaser } from '@/app/components/BlogTeaser';
import { HomeHero } from '@/app/components/home/HomeHero';
import { QuickBookingBar } from '@/app/components/home/QuickBookingBar';
import { HomePillars } from '@/app/components/home/HomePillars';
import { HomeServices } from '@/app/components/home/HomeServices';
import { HomeManifesto } from '@/app/components/home/HomeManifesto';
import { HomeFAQ } from '@/app/components/home/HomeFAQ';
import { HomeLoyalty } from '@/app/components/home/HomeLoyalty';
import { HomeVisualBanner } from '@/app/components/home/HomeVisualBanner';
import { HomeCraftsmanship } from '@/app/components/home/HomeCraftsmanship';
import { HomeBrandStory } from '@/app/components/home/HomeBrandStory';
import { FadeVisualComposition } from '@/app/components/home/FadeVisualComposition';
import { HomeStyleConfigurator } from '@/app/components/home/HomeStyleConfigurator';
import { HomeBrandHighlight } from '@/app/components/home/HomeBrandHighlight';
import { HomeSocialProof } from '@/app/components/home/HomeSocialProof';
import { HomeFirstVisitPerk } from '@/app/components/home/HomeFirstVisitPerk';
import { HomeMembershipVIP } from '@/app/components/home/HomeMembershipVIP';
import { HomeMasterBarberSpotlight } from '@/app/components/home/HomeMasterBarberSpotlight';
import { HomeExclusiveBeardSpaPromo } from '@/app/components/home/HomeExclusiveBeardSpaPromo';
import { HomeMasterclassMasteryPromo } from '@/app/components/home/HomeMasterclassMasteryPromo';
import { HomePrestigeConciergeClubPromo } from '@/app/components/home/HomePrestigeConciergeClubPromo';
import { HomeExecutiveAuraElitePromo } from '@/app/components/home/HomeExecutiveAuraElitePromo';
import { HomeVelvetCrestMasteryPromo } from '@/app/components/home/HomeVelvetCrestMasteryPromo';
import { HomeObsidianCrownGroomingPromo } from '@/app/components/home/HomeObsidianCrownGroomingPromo';
import { HomeStylePassportPromo } from '@/app/components/home/HomeStylePassportPromo';
import { HomeRoyalEssenceVaultPromo } from '@/app/components/home/HomeRoyalEssenceVaultPromo';
import { HomePortfolioGallery } from '@/app/components/home/HomePortfolioGallery';
import { HomeHairStyleMatcherQuiz } from '@/app/components/home/HomeHairStyleMatcherQuiz';

export const metadata: Metadata = pageMetadata({
  title: 'Fade — приватний барбершоп на 2 крісла, запис онлайн',
  description:
    'Мережа приватних барбершопів Fade. Точність форми, спокій і якість центру Києва поруч із домом. Стрижки від 600 ₴. Запис за 60 секунд.',
  path: '/',
});

export default async function HomePage() {
  const locations = await getLocations();
  const nearestLocation = locations.state === 'ok' ? locations.data[0] : undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BarberShop',
        name: 'FADE Barbershop',
        description: 'Мережа приватних барбершопів Fade у Києві. Точність форми, спокій і якість поруч із домом.',
        url: siteUrl,
        telephone: '+380443343333',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'вул. Велика Васильківська, 72',
          addressLocality: 'Київ',
          addressCountry: 'UA',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 50.4375,
          longitude: 30.5175,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '09:00',
            closes: '21:00',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Як записатися на стрижку?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Запис займає до 60 секунд. Оберіть послугу, майстра, зручний час та підтвердіть телефон через SMS (OTP). Без створення складних паролів.',
            },
          },
          {
            '@type': 'Question',
            name: 'Чи є знижка для нового гостя?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Так, на перший візит діє спеціальна знижка -100 ₴ на будь-яку стрижку в мережі FADE.',
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-container flex-col gap-16 px-4 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHero />
      <QuickBookingBar />

      {/* Primary Conversion & Membership Highlights */}
      <section className="flex flex-col gap-6">
        <HomeFirstVisitPerk />
        <HomeMembershipVIP />
      </section>

      {/* Signature Vaults & Masterclasses Showcase */}
      <section className="flex flex-col gap-8 py-4">
        <div className="flex flex-col gap-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-semantic-warning/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-semantic-warning w-fit">
            <span>✨ Ексклюзивні колекції та майстер-класи</span>
          </div>
          <h2 className="font-display text-h3 md:text-h2 font-bold text-fg">Приватні ритуали, преміум пакети та клубні програми</h2>
          <p className="text-bodyLg text-fg-secondary">
            Оберіть персональний формат догляду вищого рівня з гарантією форми, гарячими рушниками та затишною атмосферою студії.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <HomeVelvetCrestMasteryPromo />
          <HomeObsidianCrownGroomingPromo />
          <HomeStylePassportPromo />
          <HomeRoyalEssenceVaultPromo />
          <HomeExclusiveBeardSpaPromo />
          <HomeMasterclassMasteryPromo />
          <HomePrestigeConciergeClubPromo />
          <HomeExecutiveAuraElitePromo />
        </div>
      </section>

      <HomeMasterBarberSpotlight />
      <HomePortfolioGallery />
      <HomePillars />
      <FadeVisualComposition />
      <HomeBrandStory />
      <HomeVisualBanner />
      <HomeCraftsmanship />
      <HomeServices />
      <HomeStyleConfigurator />
      <HomeBrandHighlight />
      <HomeSocialProof />
      <HomeLoyalty />

      {nearestLocation !== undefined && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="font-display text-h3 font-semibold text-fg">Студія поруч</h2>
              <p className="text-body text-fg-secondary">Зручна локація для мешканців ЖК та району.</p>
            </div>
            <Link href="/locations" className="text-body font-medium text-fg-secondary hover:text-fg">
              Усі адреси &rarr;
            </Link>
          </div>

          <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-6">
            <div className="flex flex-col gap-1">
              <span className="text-caption font-semibold uppercase text-fg-muted">
                Флагманська студія
              </span>
              <h3 className="text-h4 font-display font-semibold text-fg">{nearestLocation.name}</h3>
              <p className="text-body text-fg-secondary">{nearestLocation.address}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/locations/${nearestLocation.code}`}
                className="inline-flex h-11 items-center justify-center rounded-input border border-line px-4 text-body font-medium text-fg hover:bg-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                Деталі та графік
              </Link>
              <Link
                href="/booking"
                className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-5 text-body font-medium text-accent-fg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                Записатися сюди
              </Link>
            </div>
          </Card>
        </section>
      )}

      <HomeManifesto />
      <HomeHairStyleMatcherQuiz />
      <HomeFAQ />
      <BlogTeaser />
    </div>
  );
}
