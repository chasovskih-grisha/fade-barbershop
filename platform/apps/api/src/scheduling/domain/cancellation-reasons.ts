/* eslint-disable max-lines -- cohesive module (202 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
/**
 * T-4560: причини скасувань і no-show, статистика та ручний override.
 *
 * Чистий домен без Nest/Prisma:
 *  - `CancellationReason` — обовʼязкова причина скасування (адмін/барбер/клієнт);
 *  - `NoShowReason` — опційна причина no-show;
 *  - «excused» no-show — адмін знімає провину, випадок не рахується у статистиці;
 *  - агрегати для дашборда (барбер/послуга/локація/канал/день тижня/година)
 *    і CSV-експорт для бухгалтерії.
 */

export const CANCELLATION_REASONS = [
  'CLIENT_REQUEST',
  'CLIENT_SICK',
  'CLIENT_SCHEDULE',
  'BARBER_SICK',
  'BARBER_VACATION',
  'SALON_CLOSED',
  'WEATHER',
  'OTHER',
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

export const NO_SHOW_REASONS = ['CLIENT_NO_SHOW', 'CLIENT_LATE', 'WRONG_TIME', 'OTHER'] as const;

export type NoShowReason = (typeof NO_SHOW_REASONS)[number];

export const MAX_CUSTOM_REASON_LENGTH = 200;

export type BookingChannel = 'online_with_deposit' | 'online_without_deposit' | 'walk_in';

export type CancellationActor = 'client' | 'barber' | 'admin';

export interface ReasonInput {
  /** `undefined` теж допустиме: форма адмінки надсилає поле завжди. */
  reason?: string | null | undefined;
  /** Вільний текст; обовʼязковий лише для `OTHER`. */
  custom?: string | null | undefined;
}

export interface ReasonRecord<TReason extends string> {
  reason: TReason;
  custom?: string;
}

export class ReasonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReasonValidationError';
  }
}

/** Override посилається на незафіксований no-show — це не помилка вводу. */
export class ReasonedEventNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReasonedEventNotFoundError';
  }
}

function normalize(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Причина скасування обовʼязкова: без неї скасування не фіксується.
 * `OTHER` вимагає вільного тексту, інакше причина неінформативна.
 */
export function parseCancellationReason(input: ReasonInput): ReasonRecord<CancellationReason> {
  const reason = normalize(input.reason).toUpperCase();
  if (!reason) throw new ReasonValidationError('Cancellation reason is required');
  if (!(CANCELLATION_REASONS as readonly string[]).includes(reason)) {
    throw new ReasonValidationError(`Unknown cancellation reason: ${input.reason}`);
  }
  return withCustom(reason as CancellationReason, input.custom);
}

/** Причина no-show опційна; невідоме значення — помилка вводу. */
export function parseNoShowReason(input: ReasonInput): ReasonRecord<NoShowReason> | null {
  const reason = normalize(input.reason).toUpperCase();
  if (!reason) return null;
  if (!(NO_SHOW_REASONS as readonly string[]).includes(reason)) {
    throw new ReasonValidationError(`Unknown no-show reason: ${input.reason}`);
  }
  return withCustom(reason as NoShowReason, input.custom);
}

function withCustom<TReason extends string>(
  reason: TReason,
  custom: string | null | undefined
): ReasonRecord<TReason> {
  const text = normalize(custom);
  if (text.length > MAX_CUSTOM_REASON_LENGTH) {
    throw new ReasonValidationError(
      `Custom reason must be ≤ ${MAX_CUSTOM_REASON_LENGTH} characters`
    );
  }
  if (reason === 'OTHER' && !text) {
    throw new ReasonValidationError('Custom text is required for the OTHER reason');
  }
  return text ? { reason, custom: text } : { reason };
}

/** Одне скасування або no-show — рядок журналу й джерело статистики. */
export interface ReasonedEvent {
  appointmentId: string;
  clientId: string;
  barberId: string;
  serviceId: string | null;
  locationId: string;
  channel: BookingChannel;
  start: Date;
  kind: 'cancellation' | 'no_show';
  cancelledBy: CancellationActor;
  reason: CancellationReason | null;
  custom?: string;
  noShowReason?: NoShowReason;
  /** Адмін зняв провину: випадок не рахується у статистиці. */
  excused: boolean;
  recordedAt: Date;
}

export interface RateBucket {
  total: number;
  count: number;
  rate: number;
}

export function emptyBucket(): RateBucket {
  return { total: 0, count: 0, rate: 0 };
}

/** Відсоток no-show у розрізі; `excused` випадки не потрапляють у чисельник. */
export function groupNoShowRates(
  events: ReasonedEvent[],
  key: (event: ReasonedEvent) => string | null
): Record<string, RateBucket> {
  const buckets: Record<string, RateBucket> = {};
  for (const event of events) {
    const group = key(event);
    if (!group) continue;
    const bucket = (buckets[group] ??= emptyBucket());
    bucket.total += 1;
    if (event.kind === 'no_show' && !event.excused) bucket.count += 1;
  }
  return finalizeRates(buckets);
}

/** Частка скасувань від усіх зафіксованих подій розкладу. */
export function cancellationRate(events: ReasonedEvent[]): number {
  if (events.length === 0) return 0;
  const cancelled = events.filter((event) => event.kind === 'cancellation').length;
  return roundRate(cancelled / events.length);
}

export function topReasons(
  events: ReasonedEvent[],
  kind: 'cancellation' | 'no_show',
  limit = 5
): Array<{ reason: string; count: number }> {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.kind !== kind || event.excused) continue;
    const reason = kind === 'no_show' ? event.noShowReason : event.reason;
    if (!reason) continue;
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .slice(0, Math.max(0, limit));
}

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export function weekdayOf(date: Date): string {
  return WEEKDAYS[date.getUTCDay()] ?? 'unknown';
}

export function hourOf(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, '0')}:00`;
}

/** Роздільник — кома; текст у лапках, щоб експорт відкривався в Excel. */
export function toReasonedEventsCsv(events: ReasonedEvent[]): string {
  const header = [
    'appointmentId',
    'clientId',
    'barberId',
    'serviceId',
    'locationId',
    'channel',
    'kind',
    'reason',
    'customReason',
    'noShowReason',
    'excused',
    'cancelledBy',
    'start',
    'recordedAt',
  ].join(',');
  const rows = events.map((event) =>
    [
      event.appointmentId,
      event.clientId,
      event.barberId,
      event.serviceId ?? '',
      event.locationId,
      event.channel,
      event.kind,
      event.reason ?? '',
      event.custom ?? '',
      event.noShowReason ?? '',
      event.excused ? 'yes' : 'no',
      event.cancelledBy,
      event.start.toISOString(),
      event.recordedAt.toISOString(),
    ]
      .map(csvCell)
      .join(',')
  );
  return [header, ...rows].join('\n');
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function finalizeRates(buckets: Record<string, RateBucket>): Record<string, RateBucket> {
  return Object.fromEntries(
    Object.entries(buckets).map(([key, bucket]) => [
      key,
      {
        total: bucket.total,
        count: bucket.count,
        rate: roundRate(bucket.total === 0 ? 0 : bucket.count / bucket.total),
      },
    ])
  );
}

function roundRate(value: number): number {
  return Number(value.toFixed(4));
}
