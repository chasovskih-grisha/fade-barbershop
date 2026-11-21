export interface MilestoneTier {
  id: string;
  name: string;
  requiredReferrals: number;
  rewardDescription: string;
  bonusUAH: number;
  claimed: boolean;
}

export const REFERRAL_CODE = 'FADE-VIP-2026';
export const SHARE_URL = `https://fade.barbershop/invite/${REFERRAL_CODE}`;

export const INITIAL_TIERS: MilestoneTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Booster',
    requiredReferrals: 1,
    rewardDescription: '150 ₴ bonus + Priority Booking',
    bonusUAH: 150,
    claimed: true,
  },
  {
    id: 'silver',
    name: 'Silver Executive',
    requiredReferrals: 3,
    rewardDescription: '500 ₴ bonus + Free Beard Trim',
    bonusUAH: 500,
    claimed: false,
  },
  {
    id: 'gold',
    name: 'Gold Mastermind',
    requiredReferrals: 5,
    rewardDescription: '1200 ₴ bonus + Free Haircut + VIP Concierge',
    bonusUAH: 1200,
    claimed: false,
  },
];
