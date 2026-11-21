import type { InactivityTier, WinBackCampaignRequest, WinBackCampaignResult } from './types';

interface TierDetails {
  tier: InactivityTier;
  discountPercentage: number;
  bonusPerk?: string;
}

function resolveTierDetails(inactivityDays: number): TierDetails {
  if (inactivityDays >= 90) {
    return {
      tier: '90_plus_days',
      discountPercentage: 30,
      bonusPerk: 'Free Beard Trim & Hot Towel',
    };
  }
  if (inactivityDays >= 60) {
    return {
      tier: '60_days',
      discountPercentage: 25,
      bonusPerk: 'Complimentary Styling Product',
    };
  }
  return { tier: '30_days', discountPercentage: 15 };
}

/**
 * Calculate win-back reactivation campaign offer based on client inactivity days.
 */
export function calculateWinBackOffer(request: WinBackCampaignRequest): WinBackCampaignResult {
  const currentDate = request.currentDate ? new Date(request.currentDate) : new Date();
  const lastVisit = new Date(request.lastVisitDate);
  const diffTime = Math.abs(currentDate.getTime() - lastVisit.getTime());
  const inactivityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (inactivityDays < 30) {
    return {
      clientId: request.clientId,
      inactivityDays,
      tier: 'active',
      eligible: false,
      discountPercentage: 0,
      promoCode: '',
      expiresAt: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  const details = resolveTierDetails(inactivityDays);
  const expiresDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const promoCode = `WNB-${request.clientId.slice(0, 6).toUpperCase()}-${details.discountPercentage}`;

  return {
    clientId: request.clientId,
    inactivityDays,
    tier: details.tier,
    eligible: true,
    discountPercentage: details.discountPercentage,
    promoCode,
    expiresAt: expiresDate.toISOString(),
    ...(details.bonusPerk ? { bonusPerk: details.bonusPerk } : {}),
  };
}
