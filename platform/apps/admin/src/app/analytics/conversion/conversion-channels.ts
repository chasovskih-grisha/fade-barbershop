export type AttributionModel = 'last-click' | 'linear' | 'time-decay' | 'first_click';
export type TimeWindow = '30d' | '90d' | '12m';

export interface ChannelShare {
  name: string;
  share: number;
  color: string;
}

export function channelBreakdown(model: AttributionModel): ChannelShare[] {
  if (model === 'first_click') {
    return [
      { name: 'Instagram Ads (Campaign Alpha)', share: 42.0, color: 'bg-accent' },
      { name: 'Google Search / SEO', share: 31.0, color: 'bg-accent-blue' },
      { name: 'Telegram Viral Referral', share: 15.0, color: 'bg-fg-muted' },
      { name: 'Direct Traffic', share: 12.0, color: 'bg-border' },
    ];
  }
  if (model === 'linear') {
    return [
      { name: 'Google Search / SEO', share: 36.5, color: 'bg-accent-blue' },
      { name: 'Instagram Ads (Campaign Alpha)', share: 34.0, color: 'bg-accent' },
      { name: 'Telegram Viral Referral', share: 18.5, color: 'bg-fg-muted' },
      { name: 'Direct Traffic', share: 11.0, color: 'bg-border' },
    ];
  }
  return [
    { name: 'Органічний пошук (Direct / SEO)', share: 48.5, color: 'bg-accent-blue' },
    { name: 'Реферальна програма (Referrals)', share: 28.0, color: 'bg-accent' },
    { name: 'Win-back та Соцмережі (Social & Campaigns)', share: 23.5, color: 'bg-fg-muted' },
  ];
}
