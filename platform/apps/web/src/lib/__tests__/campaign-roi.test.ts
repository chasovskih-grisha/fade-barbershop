import { campaignRoiAnalytics } from '../campaign-roi';

describe('Campaign ROI & Attribution Analytics', () => {
  it('tracks campaign exposure correctly', () => {
    const spy = jest.fn();
    (window as any).dataLayer = { push: spy };

    campaignRoiAnalytics.trackCampaignExposure('spring_promo_2026', {
      utm_source: 'instagram',
      utm_medium: 'social',
      utm_campaign: 'spring_promo_2026',
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'campaign_exposure',
        campaign_id: 'spring_promo_2026',
        utm_source: 'instagram',
        utm_medium: 'social',
      })
    );
  });

  it('calculates ROAS and tracks campaign conversion ROI', () => {
    const spy = jest.fn();
    (window as any).dataLayer = { push: spy };

    const roas = campaignRoiAnalytics.trackConversionRoi('spring_promo_2026', 250, 50);
    expect(roas).toBe(5);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'campaign_conversion_roi',
        campaign_id: 'spring_promo_2026',
        revenue: 250,
        roas: 5,
      })
    );
  });

  it('calculates linear attribution weights for touchpoints', () => {
    const spy = jest.fn();
    (window as any).dataLayer = { push: spy };

    const weights = campaignRoiAnalytics.calculateAttributionWeights([
      'google_search',
      'instagram_ad',
      'direct',
    ]);
    expect(weights['google_search']).toBeCloseTo(0.3333);
    expect(weights['instagram_ad']).toBeCloseTo(0.3333);
    expect(weights['direct']).toBeCloseTo(0.3333);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'attribution_weights_calculated',
        touchpoints_count: 3,
      })
    );
  });
});
