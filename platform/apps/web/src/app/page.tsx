import type { Metadata } from 'next';
import { getLocations } from '@/lib/api/locations';
import { isBookingOpen } from '@/lib/api/booking-readiness';
import { pageMetadata } from '@/lib/metadata';
import { BlogTeaser } from '@/app/components/BlogTeaser';
import { HomeHero } from '@/app/components/home/HomeHero';
import { HomePreparingHero } from '@/app/components/home/HomePreparingHero';
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
import { HomePortfolioGallery } from '@/app/components/home/HomePortfolioGallery';
import { HomeHairStyleMatcherQuiz } from '@/app/components/home/HomeHairStyleMatcherQuiz';
import { HomeSignatureShowcase } from '@/app/components/home/HomeSignatureShowcase';
import { HomeNearestLocation } from '@/app/components/home/HomeNearestLocation';
import { buildHomeJsonLd } from './homeJsonLd';

export const metadata: Metadata = pageMetadata({
  title: 'Fade — приватний барбершоп на 2 крісла',
  description:
    'Мережа приватних барбершопів Fade. Точність форми, спокій і якість центру Києва поруч із домом. Онлайн-запис відкривається разом із першою студією.',
  path: '/',
});

export default async function HomePage() {
  const locations = await getLocations();
  const nearestLocation = locations.state === 'ok' ? locations.data[0] : undefined;
  const bookingOpen = isBookingOpen(locations);
  const jsonLd = buildHomeJsonLd();

  // T-4614e: підтверджено порожній каталог — жодних CTA запису чи цін.
  // Показуємо лише обіцянку відкриття й матеріали, які не продають послугу.
  if (!bookingOpen) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-16 px-4 py-12 md:py-16">
        <HomePreparingHero />
        <HomePillars />
        <HomeBrandStory />
        <BlogTeaser />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-container flex-col gap-16 px-4 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHero />
      <QuickBookingBar />

      <section className="flex flex-col gap-6">
        <HomeFirstVisitPerk />
        <HomeMembershipVIP />
      </section>

      <HomeSignatureShowcase />

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

      {nearestLocation !== undefined && <HomeNearestLocation location={nearestLocation} />}

      <HomeManifesto />
      <HomeHairStyleMatcherQuiz />
      <HomeFAQ />
      <BlogTeaser />
    </div>
  );
}
