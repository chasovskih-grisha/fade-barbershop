import type { ReferralTier } from './types';

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    id: 'tier-1',
    name: 'Gentleman Start',
    requiredReferrals: 1,
    referrerDiscountPercent: 15,
    refereeDiscountPercent: 15,
    bonusCreditUah: 100,
    vipPerksUnlocked: false,
  },
  {
    id: 'tier-2',
    name: 'Fade Ambassador',
    requiredReferrals: 3,
    referrerDiscountPercent: 25,
    refereeDiscountPercent: 20,
    bonusCreditUah: 300,
    vipPerksUnlocked: true,
  },
  {
    id: 'tier-3',
    name: 'Elite VIP Circle',
    requiredReferrals: 5,
    referrerDiscountPercent: 40,
    refereeDiscountPercent: 25,
    bonusCreditUah: 600,
    vipPerksUnlocked: true,
  },
];
