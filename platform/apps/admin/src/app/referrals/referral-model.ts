export interface ReferralItem {
  id: string;
  friendName: string;
  friendPhone: string;
  referrerName: string;
  referrerPhone: string;
  locationName: string;
  registrationDate: string;
  status: 'booked' | 'completed' | 'no_show' | 'cancelled';
  rewardStatus: 'pending' | 'awarded' | 'revoked';
  rewardAmount: string;
  suspiciousPattern?: 'shared_phone' | 'device_cluster' | 'series_no_show';
}

export type ReferralFilter = 'all' | 'suspicious' | 'pending' | 'awarded' | 'revoked';

export interface ReferralProgramSettings {
  referralDiscountPct: number;
  rewardAmount: string;
  rewardExpiryDays: number;
  attributionWindowDays: number;
  enabled: boolean;
}

export const DEFAULT_SETTINGS: ReferralProgramSettings = {
  referralDiscountPct: 15,
  rewardAmount: '200 UAH',
  rewardExpiryDays: 90,
  attributionWindowDays: 30,
  enabled: true,
};

export const FILTERS: Array<{ value: ReferralFilter; label: string }> = [
  { value: 'all', label: 'Усі' },
  { value: 'suspicious', label: "⚠️ Підозрілі (Анти-аб'юз)" },
  { value: 'pending', label: 'Очікують' },
  { value: 'awarded', label: 'Нараховані' },
  { value: 'revoked', label: 'Анульовані' },
];

export function filterReferrals(items: ReferralItem[], filter: ReferralFilter, query: string) {
  return items.filter((item) => {
    if (filter === 'suspicious' && !item.suspiciousPattern) return false;
    if (filter === 'pending' && item.rewardStatus !== 'pending') return false;
    if (filter === 'awarded' && item.rewardStatus !== 'awarded') return false;
    if (filter === 'revoked' && item.rewardStatus !== 'revoked') return false;
    if (!query) return true;
    const term = query.toLowerCase();
    return [item.friendName, item.friendPhone, item.referrerName, item.referrerPhone].some(
      (value) => value.toLowerCase().includes(term)
    );
  });
}
