import { AcquisitionRetentionEngine, MarketingExperienceEngine, Client } from '../src/index';

describe('MarketingExperienceEngine & Brand Impact Specialist', () => {
  let marketingEngine: MarketingExperienceEngine;

  beforeEach(() => {
    marketingEngine = new MarketingExperienceEngine();
  });

  test('should return active promotional banners', () => {
    const banners = marketingEngine.getActiveBanners();
    expect(banners.length).toBeGreaterThan(0);
    expect(banners[0].headline).toBeDefined();
    expect(banners[0].badgeText).toBe('LIMITED TIME OFFER');
  });

  test('should return verified testimonials for social proof', () => {
    const testimonials = marketingEngine.getTestimonials();
    expect(testimonials.length).toBeGreaterThan(0);
    expect(testimonials[0].verified).toBe(true);
    expect(testimonials[0].rating).toBe(5);
  });

  test('should return trust indicators for conversion optimization', () => {
    const trustIndicators = marketingEngine.getTrustIndicators();
    expect(trustIndicators.length).toBe(3);
    expect(trustIndicators[0].metric).toBe('100% Quality');
  });

  test('should render HTML promotion widget correctly', () => {
    const htmlWidget = marketingEngine.renderPromotionWidget('promo-spring-2026');
    expect(htmlWidget).toContain('fade-promo-banner');
    expect(htmlWidget).toContain('Elevate Your Grooming Experience');
    expect(htmlWidget).toContain('Claim Free Upgrade');
  });
});
