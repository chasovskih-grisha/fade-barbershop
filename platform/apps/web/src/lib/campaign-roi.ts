/**
 * FADE Real-Time Conversion Attribution & Campaign ROI Analytics Module
 * Integrates channel attribution weights, campaign CPA / ROAS tracking, and conversion velocity.
 */

import { trackEvent, UtmParams } from './analytics';

export type CampaignAttributionRecord = {
  campaign_id: string;
  source: string;
  medium: string;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
};

export const campaignRoiAnalytics = {
  trackCampaignExposure: (campaignId: string, utm: UtmParams) => {
    trackEvent('campaign_exposure', {
      campaign_id: campaignId,
      utm_source: utm.utm_source || 'direct',
      utm_medium: utm.utm_medium || 'none',
      utm_campaign: utm.utm_campaign || campaignId,
    });
  },

  trackConversionRoi: (campaignId: string, revenue: number, estimatedSpend: number = 50) => {
    const roas = estimatedSpend > 0 ? Number((revenue / estimatedSpend).toFixed(2)) : 0;
    trackEvent('campaign_conversion_roi', {
      campaign_id: campaignId,
      revenue,
      estimated_spend: estimatedSpend,
      roas,
    });
    return roas;
  },

  calculateAttributionWeights: (touchpoints: string[]): Record<string, number> => {
    if (!touchpoints || touchpoints.length === 0) return {};
    const weightPerTouch = Number((1 / touchpoints.length).toFixed(4));
    const weights: Record<string, number> = {};
    touchpoints.forEach((tp) => {
      weights[tp] = weightPerTouch;
    });
    trackEvent('attribution_weights_calculated', {
      touchpoints_count: touchpoints.length,
      model: 'linear',
    });
    return weights;
  },
};
