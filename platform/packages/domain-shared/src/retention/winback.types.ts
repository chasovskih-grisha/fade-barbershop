export type InactivityTier = '30_days' | '60_days' | '90_plus_days';

export interface WinBackCampaignRequest {
  clientId: string;
  lastVisitDate: string; // ISO date
  currentDate?: string; // ISO date, defaults to now
  previousVisitsCount: number;
}

export interface WinBackCampaignResult {
  clientId: string;
  inactivityDays: number;
  tier: InactivityTier | 'active';
  eligible: boolean;
  discountPercentage: number;
  bonusPerk?: string;
  promoCode: string;
  expiresAt: string;
}
