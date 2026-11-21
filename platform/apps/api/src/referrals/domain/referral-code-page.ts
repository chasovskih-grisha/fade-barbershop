/* eslint-disable max-lines -- cohesive module (166 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
/**
 * T-4457: сторінка «Мій код» реферальної програми — чиста політика.
 *
 * Що повертає сторінка:
 *  - код клієнта, посилання для шерінгу, payload для QR і текст share sheet;
 *  - статуси запрошених без персональних даних (лише порядковий підпис);
 *  - бали: нараховані тільки за «реально прийшов» (`rewarded`) і в очікуванні
 *    для `qualified` — клік по лендінгу балів не дає (анти-фрод T-220);
 *  - місячний ліміт програми й індикатор «залишилось N місць».
 *
 * Час і таймзона передаються явно — тести детерміновані.
 */

export type InvitationStatus = 'invited' | 'arrived' | 'rewarded' | 'revoked';

export type ReferralRecordStatus = 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REVOKED';

export interface ReferralProgramConfig {
  pointsPerReferral: number;
  monthlyLimit: number;
  shareBaseUrl: string;
  timeZone: string;
}

export const DEFAULT_REFERRAL_PROGRAM_CONFIG: ReferralProgramConfig = {
  pointsPerReferral: 200,
  monthlyLimit: 5,
  shareBaseUrl: 'https://fade.app/r',
  timeZone: 'Europe/Kyiv',
};

export class ReferralCodePageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferralCodePageError';
  }
}

export function normalizeReferralProgramConfig(
  overrides: Partial<ReferralProgramConfig> = {}
): ReferralProgramConfig {
  const config: ReferralProgramConfig = {
    ...DEFAULT_REFERRAL_PROGRAM_CONFIG,
    ...overrides,
  };

  if (!Number.isInteger(config.pointsPerReferral) || config.pointsPerReferral <= 0) {
    throw new ReferralCodePageError('pointsPerReferral must be a positive integer');
  }
  if (!Number.isInteger(config.monthlyLimit) || config.monthlyLimit < 0) {
    throw new ReferralCodePageError('monthlyLimit must be a non-negative integer');
  }
  const base = config.shareBaseUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/\s]+/.test(base)) {
    throw new ReferralCodePageError('shareBaseUrl must be an http(s) URL');
  }
  if (!config.timeZone.trim()) throw new ReferralCodePageError('timeZone is required');

  return { ...config, shareBaseUrl: base };
}

/** Місяць у таймзоні програми — ключ місячного ліміту. */
export function referralMonthKey(
  at: Date,
  timeZone: string = DEFAULT_REFERRAL_PROGRAM_CONFIG.timeZone
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone,
  }).formatToParts(at);
  const pick = (type: string): string => parts.find((part) => part.type === type)?.value ?? '00';
  return `${pick('year')}-${pick('month')}`;
}

/** Мінімальне представлення рефералу, потрібне сторінці. */
export interface ReferralForCodePage {
  status: ReferralRecordStatus;
  createdAt: Date;
  qualifiedAt?: Date | null;
  rewardIssuedAt?: Date | null;
}

export interface InvitationSummary {
  /** Порядковий підпис без персональних даних: «Запрошений #1». */
  label: string;
  status: InvitationStatus;
  invitedAt: Date;
  arrivedAt: Date | null;
  rewardedAt: Date | null;
}

export interface ReferralCodePageView {
  code: string;
  shareUrl: string;
  qrPayload: string;
  shareText: string;
  pointsPerReferral: number;
  pointsEarned: number;
  pointsPending: number;
  invitations: InvitationSummary[];
  totals: Record<InvitationStatus, number> & { total: number };
  monthly: {
    limit: number;
    used: number;
    remaining: number;
    limitReached: boolean;
    month: string;
  };
}

export function invitationStatusOf(status: ReferralRecordStatus): InvitationStatus {
  switch (status) {
    case 'PENDING':
      return 'invited';
    case 'QUALIFIED':
      return 'arrived';
    case 'REWARDED':
      return 'rewarded';
    case 'REVOKED':
      return 'revoked';
  }
}

export function referralShareUrl(code: string, config: ReferralProgramConfig): string {
  return `${config.shareBaseUrl}/${encodeURIComponent(code.trim().toUpperCase())}`;
}

export function referralShareText(input: {
  code: string;
  shareUrl: string;
  pointsPerReferral: number;
}): string {
  return `FADE: Запрошую до барбера! Мій код ${input.code} — тобі бонуси за перший візит, мені ${input.pointsPerReferral} балів. ${input.shareUrl}`;
}

/**
 * Складає сторінку. `referrals` — лише реферали цього клієнта (фільтрує
 * сервіс); порядок у вигляді — від найновішого.
 */
export function buildReferralCodePage(input: {
  code: string;
  referrals: ReferralForCodePage[];
  now: Date;
  config?: ReferralProgramConfig;
}): ReferralCodePageView {
  const config = normalizeReferralProgramConfig(input.config ?? DEFAULT_REFERRAL_PROGRAM_CONFIG);
  const code = input.code.trim().toUpperCase();
  if (!code) throw new ReferralCodePageError('Referral code is required');

  const shareUrl = referralShareUrl(code, config);
  const month = referralMonthKey(input.now, config.timeZone);
  const ordered = [...input.referrals].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const totals: Record<InvitationStatus, number> & { total: number } = {
    invited: 0,
    arrived: 0,
    rewarded: 0,
    revoked: 0,
    total: ordered.length,
  };

  const invitations: InvitationSummary[] = ordered.map((referral, index) => {
    const status = invitationStatusOf(referral.status);
    totals[status] += 1;
    return {
      label: `Запрошений #${index + 1}`,
      status,
      invitedAt: referral.createdAt,
      arrivedAt: referral.qualifiedAt ?? null,
      rewardedAt: referral.rewardIssuedAt ?? null,
    };
  });

  const used = ordered.filter(
    (referral) =>
      referral.status !== 'REVOKED' &&
      referralMonthKey(referral.createdAt, config.timeZone) === month
  ).length;
  const remaining = Math.max(0, config.monthlyLimit - used);

  return {
    code,
    shareUrl,
    qrPayload: shareUrl,
    shareText: referralShareText({
      code,
      shareUrl,
      pointsPerReferral: config.pointsPerReferral,
    }),
    pointsPerReferral: config.pointsPerReferral,
    // Бонуси лише за підтверджений візит, не за клік по лендінгу.
    pointsEarned: totals.rewarded * config.pointsPerReferral,
    pointsPending: totals.arrived * config.pointsPerReferral,
    invitations,
    totals,
    monthly: {
      limit: config.monthlyLimit,
      used,
      remaining,
      limitReached: remaining === 0,
      month,
    },
  };
}
