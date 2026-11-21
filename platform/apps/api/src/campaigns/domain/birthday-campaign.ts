/* eslint-disable max-lines, complexity -- cohesive module (253 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 2 functions with inherent domain branching (worst: normalizeBirthdayCampaignConfig, complexity 14 vs 10); refactor tracked in T-2500f */
/**
 * T-4459: авто-кампанія «День народження» — чиста політика без Nest/Prisma.
 *
 * Що вирішує цей модуль:
 *  - коли настає вікно привітання (`leadDays` до дня народження);
 *  - кому надсилати: лише клієнтам із підтвердженою датою та маркетинговою
 *    згодою (`R-4459`: без згоди авто-оффер не йде);
 *  - «не більше одного разу на рік» — за відбитком `clientId:рік`;
 *  - 29 лютого в невисокосний рік святкуємо 28 лютого (дата в CRM без року);
 *  - аудит ручної зміни/підтвердження дати адміном.
 *
 * Час передається явно (`now`, `timeZone`), тому тести детерміновані.
 */

export interface BirthdayDate {
  day: number;
  month: number;
}

export type BirthdayCampaignChannel = 'sms' | 'email' | 'push';

export type BirthdaySuppressionReason =
  | 'campaign_disabled'
  | 'no_birthday'
  | 'date_unconfirmed'
  | 'no_marketing_consent'
  | 'outside_window'
  | 'already_offered';

export interface BirthdayCampaignConfig {
  enabled: boolean;
  /** За скільки днів до дня народження стартує вікно. */
  leadDays: number;
  discountPercent: number;
  validDays: number;
  channels: BirthdayCampaignChannel[];
  timeZone: string;
  maxPerClientPerYear: number;
}

export const BIRTHDAY_CAMPAIGN_TIME_ZONE = 'Europe/Kyiv';

export const DEFAULT_BIRTHDAY_CAMPAIGN_CONFIG: BirthdayCampaignConfig = {
  enabled: true,
  leadDays: 7,
  discountPercent: 15,
  validDays: 14,
  channels: ['sms'],
  timeZone: BIRTHDAY_CAMPAIGN_TIME_ZONE,
  maxPerClientPerYear: 1,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export class BirthdayCampaignError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BirthdayCampaignError';
  }
}

export interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

export function daysInMonth(month: number, year: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isLeapYear(year: number): boolean {
  return daysInMonth(2, year) === 29;
}

/** Дата без року: 29 лютого валідне, бо рік у CRM не зберігається. */
export function isValidBirthday(birthday: BirthdayDate): boolean {
  if (!Number.isInteger(birthday.day) || !Number.isInteger(birthday.month)) return false;
  if (birthday.month < 1 || birthday.month > 12) return false;
  if (birthday.day < 1) return false;
  const limit = birthday.month === 2 ? 29 : daysInMonth(birthday.month, 2024);
  return birthday.day <= limit;
}

export function normalizeBirthdayCampaignConfig(
  overrides: Partial<BirthdayCampaignConfig> = {}
): BirthdayCampaignConfig {
  const config: BirthdayCampaignConfig = { ...DEFAULT_BIRTHDAY_CAMPAIGN_CONFIG, ...overrides };

  if (!Number.isInteger(config.leadDays) || config.leadDays < 0 || config.leadDays > 60) {
    throw new BirthdayCampaignError('leadDays must be an integer between 0 and 60');
  }
  if (
    !Number.isInteger(config.discountPercent) ||
    config.discountPercent <= 0 ||
    config.discountPercent > 100
  ) {
    throw new BirthdayCampaignError('discountPercent must be an integer between 1 and 100');
  }
  if (!Number.isInteger(config.validDays) || config.validDays < 1 || config.validDays > 365) {
    throw new BirthdayCampaignError('validDays must be an integer between 1 and 365');
  }
  if (config.channels.length === 0) {
    throw new BirthdayCampaignError('At least one delivery channel is required');
  }
  if (new Set(config.channels).size !== config.channels.length) {
    throw new BirthdayCampaignError('Delivery channels must be unique');
  }
  if (!Number.isInteger(config.maxPerClientPerYear) || config.maxPerClientPerYear < 1) {
    throw new BirthdayCampaignError('maxPerClientPerYear must be a positive integer');
  }

  return { ...config, channels: [...config.channels] };
}

/** Локальні частини дати в таймзоні локації. */
export function localDateParts(
  at: Date,
  timeZone: string = BIRTHDAY_CAMPAIGN_TIME_ZONE
): LocalDateParts & { hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(at);

  const pick = (type: string): number =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? '0', 10);

  return { year: pick('year'), month: pick('month'), day: pick('day'), hour: pick('hour') };
}

export function addDays(parts: LocalDateParts, delta: number): LocalDateParts {
  const moved = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + delta * DAY_MS);
  return {
    year: moved.getUTCFullYear(),
    month: moved.getUTCMonth() + 1,
    day: moved.getUTCDate(),
  };
}

export function dayDifference(from: LocalDateParts, to: LocalDateParts): number {
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((b - a) / DAY_MS);
}

/**
 * День народження в конкретному році. 29 лютого в невисокосний рік
 * переноситься на 28 лютого, інакше такі клієнти не отримали б привітання
 * три роки з чотирьох.
 */
export function birthdayOccurrence(birthday: BirthdayDate, year: number): LocalDateParts {
  if (birthday.month === 2 && birthday.day === 29 && !isLeapYear(year)) {
    return { year, month: 2, day: 28 };
  }
  return { year, month: birthday.month, day: birthday.day };
}

export interface NextBirthday {
  occurrence: LocalDateParts;
  /** Днів до дня народження: 0 — сьогодні, від'ємних не буває. */
  daysUntil: number;
}

/** Найближчий день народження на або після `today`. */
export function nextBirthdayOccurrence(
  birthday: BirthdayDate,
  today: LocalDateParts
): NextBirthday {
  const thisYear = birthdayOccurrence(birthday, today.year);
  const diff = dayDifference(today, thisYear);
  if (diff >= 0) return { occurrence: thisYear, daysUntil: diff };
  const next = birthdayOccurrence(birthday, today.year + 1);
  return { occurrence: next, daysUntil: dayDifference(today, next) };
}

/** Відбиток «один оффер на рік»: клієнт + рік дня народження. */
export function birthdayFingerprint(clientId: string, occurrenceYear: number): string {
  return `birthday:${clientId}:${occurrenceYear}`;
}

export interface BirthdayCampaignClient {
  clientId: string;
  birthday: BirthdayDate | null;
  /** Дата підтверджена клієнтом або адміном; непідтверджена — у лог, без оффера. */
  birthdayConfirmed: boolean;
  marketingConsent: boolean;
}

export interface BirthdayOffer {
  clientId: string;
  birthday: BirthdayDate;
  occurrenceYear: number;
  daysUntil: number;
  fingerprint: string;
  discountPercent: number;
  channels: BirthdayCampaignChannel[];
  validUntil: LocalDateParts;
  text: string;
}

export interface BirthdayCampaignPlan {
  offers: BirthdayOffer[];
  suppressed: Array<{ clientId: string; reason: BirthdaySuppressionReason }>;
}

/** Текст привітання (SMS/push/email — спільний, без URL-скорочень). */
export function renderBirthdayOffer(input: {
  discountPercent: number;
  validUntil: LocalDateParts;
}): string {
  const until = `${String(input.validUntil.day).padStart(2, '0')}.${String(
    input.validUntil.month
  ).padStart(2, '0')}.${input.validUntil.year}`;
  return `FADE: З днем народження! Даруємо ${input.discountPercent}% на наступний візит до ${until}.`;
}

/**
 * Планує привітання: вікно, згода, підтвердження дати, ліміт «раз на рік».
 * Функція без побічних ефектів — стан передається (`offeredFingerprints`).
 */
export function planBirthdayCampaign(input: {
  clients: BirthdayCampaignClient[];
  now: Date;
  config?: BirthdayCampaignConfig;
  offeredFingerprints?: ReadonlySet<string>;
}): BirthdayCampaignPlan {
  const config = normalizeBirthdayCampaignConfig(input.config ?? DEFAULT_BIRTHDAY_CAMPAIGN_CONFIG);
  const offered = input.offeredFingerprints ?? new Set<string>();
  const today = localDateParts(input.now, config.timeZone);
  const plan: BirthdayCampaignPlan = { offers: [], suppressed: [] };

  for (const client of input.clients) {
    if (!config.enabled) {
      plan.suppressed.push({ clientId: client.clientId, reason: 'campaign_disabled' });
      continue;
    }
    if (!client.birthday || !isValidBirthday(client.birthday)) {
      plan.suppressed.push({ clientId: client.clientId, reason: 'no_birthday' });
      continue;
    }
    if (!client.birthdayConfirmed) {
      plan.suppressed.push({ clientId: client.clientId, reason: 'date_unconfirmed' });
      continue;
    }
    if (!client.marketingConsent) {
      plan.suppressed.push({ clientId: client.clientId, reason: 'no_marketing_consent' });
      continue;
    }

    const next = nextBirthdayOccurrence(client.birthday, today);
    if (next.daysUntil > config.leadDays) {
      plan.suppressed.push({ clientId: client.clientId, reason: 'outside_window' });
      continue;
    }

    const fingerprint = birthdayFingerprint(client.clientId, next.occurrence.year);
    if (offered.has(fingerprint)) {
      plan.suppressed.push({ clientId: client.clientId, reason: 'already_offered' });
      continue;
    }

    const validUntil = addDays(next.occurrence, config.validDays);
    plan.offers.push({
      clientId: client.clientId,
      birthday: client.birthday,
      occurrenceYear: next.occurrence.year,
      daysUntil: next.daysUntil,
      fingerprint,
      discountPercent: config.discountPercent,
      channels: [...config.channels],
      validUntil,
      text: renderBirthdayOffer({
        discountPercent: config.discountPercent,
        validUntil,
      }),
    });
  }

  return plan;
}

export interface BirthdayAuditEntry {
  clientId: string;
  at: Date;
  by: string;
  source: 'client' | 'admin';
  from: BirthdayDate | null;
  to: BirthdayDate;
}

/** Зміна/підтвердження дати: валідація й запис аудиту (хто, коли, що було). */
export function verifyBirthdayDate(input: {
  clientId: string;
  birthday: BirthdayDate;
  previous: BirthdayDate | null;
  by: string;
  at: Date;
  source?: 'client' | 'admin';
}): BirthdayAuditEntry {
  if (!isValidBirthday(input.birthday)) {
    throw new BirthdayCampaignError(
      `Invalid birthday: ${input.birthday.day}/${input.birthday.month}`
    );
  }
  const by = input.by.trim();
  if (!by) throw new BirthdayCampaignError('Author of the birthday change is required');

  return {
    clientId: input.clientId,
    at: input.at,
    by,
    source: input.source ?? 'admin',
    from: input.previous ? { day: input.previous.day, month: input.previous.month } : null,
    to: { day: input.birthday.day, month: input.birthday.month },
  };
}
