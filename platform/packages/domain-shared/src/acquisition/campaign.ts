import type { ClientRetentionProfile, WinbackCampaign } from './types';

export function generateReferralCode(clientId: string): string {
  const cleanId = clientId
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
  return `FADE-${cleanId || 'VIP'}-${Math.floor(100 + Math.random() * 900)}`;
}

export function generateWinbackCampaign(profile: ClientRetentionProfile): WinbackCampaign {
  const segment =
    profile.lastVisitDaysAgo > 60
      ? 'churned_60_plus'
      : profile.lastVisitDaysAgo > 30
        ? 'churned_30_60'
        : 'at_risk';
  const discountPercent = profile.lastVisitDaysAgo > 60 ? 30 : 20;
  const freeServiceAddon =
    profile.tier === 'gold' || profile.tier === 'platinum'
      ? 'beard_trim_or_styling_gel'
      : undefined;

  return {
    campaignId: `winback-${profile.clientId}-${Date.now()}`,
    name: `FADE Win-Back Campaign (${profile.tier.toUpperCase()})`,
    targetSegment: segment,
    discountVoucherCode: `COMEBACK-${discountPercent}-${Math.floor(1000 + Math.random() * 9000)}`,
    discountPercent,
    freeServiceAddon,
    validityDays: 14,
  };
}
