export type LoyaltyTierLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyTierConfig {
  level: LoyaltyTierLevel;
  minVisits: number;
  discountPercent: number;
  perks: string[];
}

export const DEFAULT_LOYALTY_TIERS: LoyaltyTierConfig[] = [
  { level: 'BRONZE', minVisits: 0, discountPercent: 0, perks: ['Basic 7th visit free reward'] },
  { level: 'SILVER', minVisits: 5, discountPercent: 5, perks: ['5% service discount', 'Priority booking'] },
  { level: 'GOLD', minVisits: 12, discountPercent: 10, perks: ['10% service discount', 'Complimentary beverage', 'Priority waitlist'] },
  { level: 'PLATINUM', minVisits: 25, discountPercent: 15, perks: ['15% VIP discount', 'Complimentary styling products', 'Dedicated VIP lounge'] },
];

export function determineLoyaltyTier(completedVisits: number, tiers: LoyaltyTierConfig[] = DEFAULT_LOYALTY_TIERS): LoyaltyTierConfig {
  let matched: LoyaltyTierConfig = tiers[0] ?? { level: 'BRONZE', minVisits: 0, discountPercent: 0, perks: [] };
  for (const tier of tiers) {
    if (completedVisits >= tier.minVisits) {
      matched = tier;
    } else {
      break;
    }
  }
  return matched;
}
