import type { ReferralData } from './useReferralPage';

export const REFERRAL_MOCK_DATA: ReferralData = {
  code: 'FADE-VIP-7749',
  shareUrl: 'https://fade.barbershop/book?ref=FADE-VIP-7749',
  earnedPoints: 300,
  monthlyLimit: 5,
  monthlyUsed: 2,
  referrals: [
    {
      id: 'ref-1',
      maskedName: 'Друг #1',
      status: 'rewarded',
      createdAt: '2026-11-01T10:00:00Z',
      rewardEarned: 150,
    },
    {
      id: 'ref-2',
      maskedName: 'Друг #2',
      status: 'pending',
      createdAt: '2026-11-08T14:30:00Z',
      rewardEarned: 150,
    },
  ],
};
