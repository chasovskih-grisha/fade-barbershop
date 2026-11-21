import type { ReferralItem } from './referral-model';

const STATUS: Record<ReferralItem['status'], { label: string; tone: string }> = {
  completed: { label: 'Завершив візит', tone: 'bg-semantic-success/10 text-semantic-success' },
  booked: { label: 'Записався', tone: 'bg-blue-500/10 text-accent-blue' },
  no_show: { label: 'No-show', tone: 'bg-rose-500/10 text-semantic-danger' },
  cancelled: { label: 'Скасовано', tone: 'bg-rose-500/10 text-semantic-danger' },
};

const REWARD: Record<ReferralItem['rewardStatus'], { label: string; tone: string }> = {
  awarded: { label: 'Нарахована', tone: 'text-semantic-success' },
  pending: { label: 'Очікує', tone: 'text-semantic-warning' },
  revoked: { label: 'Анульована', tone: 'text-semantic-danger' },
};

const PATTERN: Record<NonNullable<ReferralItem['suspiciousPattern']>, string> = {
  shared_phone: 'Спільний телефон',
  device_cluster: 'Кластер пристроїв',
  series_no_show: 'Серія no-show',
};

export function statusView(status: ReferralItem['status']) {
  return STATUS[status];
}

export function rewardView(status: ReferralItem['rewardStatus']) {
  return REWARD[status];
}

export function patternLabel(pattern: ReferralItem['suspiciousPattern']): string {
  return pattern ? PATTERN[pattern] : '—';
}
