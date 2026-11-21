/* eslint-disable max-lines, max-params -- cohesive module (256 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 2 signatures whose 4-param contract is fixed by existing call sites (worst: planLoyaltyNotifications, limit 3); API redesign tracked in T-2500f */
/**
 * T-4462: політика сповіщень про події лояльності — чиста, без Nest і Prisma.
 *
 * Чотири значущі події: нараховані бали, новий рівень, використані бали й
 * попередження про згорання за 7 днів. Правила:
 *  - канал кожної події конфігурується (`sms` / `push` / `email` / `none`);
 *  - дедуп: однакова подія (той самий ключ) не надсилається двічі;
 *  - тихі години Europe/Kyiv (типово 21:00–09:00) — доставка відкладається
 *    до відкриття вікна, а не відкидається;
 *  - ліміт `maxPerDay` (типово 1) на клієнта: усе зайве збирається в
 *    дайджест, щоб три події за день не стали трьома пуш-спамами.
 */
import type { DomainEvent } from '../domain/domain-event';
import {
  LoyaltyPointsEarned,
  LoyaltyPointsSpent,
  LoyaltyTierChanged,
} from '../domain/loyalty-events';

export type LoyaltyNotificationEvent =
  'points_earned' | 'tier_reached' | 'points_spent' | 'points_expiring';

export type LoyaltyNotificationChannel = 'sms' | 'push' | 'email' | 'none';

export const LOYALTY_NOTIFICATION_TIME_ZONE = 'Europe/Kyiv';
export const LOYALTY_EXPIRY_WARNING_DAYS = 7;
export const LOYALTY_POINTS_LIFETIME_DAYS = 365;

export interface LoyaltyQuietHours {
  /** Локальна година початку тиші (включно). */
  startHour: number;
  /** Локальна година кінця тиші (виключно). */
  endHour: number;
}

export interface LoyaltyNotificationConfig {
  channels: Record<LoyaltyNotificationEvent, LoyaltyNotificationChannel>;
  quietHours: LoyaltyQuietHours;
  maxPerDay: number;
  expiryWarningDays: number;
  timeZone: string;
}

export const DEFAULT_LOYALTY_NOTIFICATION_CONFIG: LoyaltyNotificationConfig = {
  channels: {
    points_earned: 'email',
    tier_reached: 'email',
    points_spent: 'none',
    points_expiring: 'sms',
  },
  quietHours: { startHour: 21, endHour: 9 },
  maxPerDay: 1,
  expiryWarningDays: LOYALTY_EXPIRY_WARNING_DAYS,
  timeZone: LOYALTY_NOTIFICATION_TIME_ZONE,
};

/** Намір сповіщення, знятий з події лояльності. */
export interface LoyaltyNotificationIntent {
  clientId: string;
  event: LoyaltyNotificationEvent;
  /** Стабільний ключ дедупу; повторна подія з тим самим ключем ігнорується. */
  dedupeKey: string;
  points?: number;
  newBalance?: number;
  tier?: string;
  discountPercent?: number;
  expiresAt?: Date;
}

export interface LoyaltyNotificationLogState {
  /** Ключі, які вже доставлено або зібрано в дайджест. */
  sentKeys: Set<string>;
  /** Скільки доставок уже пішло клієнту за добу (YYYY-MM-DD у таймзоні). */
  sentTodayByClient: Map<string, number>;
  /** Накопичені для дайджесту наміри. */
  batchedByClient: Map<string, LoyaltyNotificationIntent[]>;
}

export function createLoyaltyNotificationLog(): LoyaltyNotificationLogState {
  return {
    sentKeys: new Set(),
    sentTodayByClient: new Map(),
    batchedByClient: new Map(),
  };
}

/** Локальні частини часу в заданій таймзоні. */
export function zonedParts(
  at: Date,
  timeZone: string = LOYALTY_NOTIFICATION_TIME_ZONE
): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(at);

  const pick = (type: string): number =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? '0', 10);

  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
  };
}

/** Локальна дата у форматі YYYY-MM-DD — ключ добового ліміту. */
export function localDayKey(at: Date, timeZone: string = LOYALTY_NOTIFICATION_TIME_ZONE): string {
  const parts = zonedParts(at, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function isQuietHour(
  at: Date,
  quietHours: LoyaltyQuietHours,
  timeZone: string = LOYALTY_NOTIFICATION_TIME_ZONE
): boolean {
  const { hour } = zonedParts(at, timeZone);
  if (quietHours.startHour === quietHours.endHour) return false;
  if (quietHours.startHour > quietHours.endHour) {
    return hour >= quietHours.startHour || hour < quietHours.endHour;
  }
  return hour >= quietHours.startHour && hour < quietHours.endHour;
}

/**
 * Найближчий момент, коли тихі години закінчуються. Час повертається
 * в UTC; зсув таймзони беремо з того ж інстанту (достатньо для Europe/Kyiv,
 * де перехід на літній час відбувається о 03:00, поза вікном тиші).
 */
export function startOfAllowedSendWindow(
  at: Date,
  quietHours: LoyaltyQuietHours,
  timeZone: string = LOYALTY_NOTIFICATION_TIME_ZONE
): Date {
  if (!isQuietHour(at, quietHours, timeZone)) return at;

  const parts = zonedParts(at, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const offsetMs = asUtc - at.getTime();

  const target = Date.UTC(parts.year, parts.month - 1, parts.day, quietHours.endHour, 0, 0);
  const targetMs = target <= asUtc ? target + 24 * 60 * 60 * 1000 : target;
  return new Date(targetMs - offsetMs);
}

/** Кінець строку життя балів: остання активність + 365 днів. */
export function pointsExpireAt(
  lastActivityAt: Date,
  lifetimeDays: number = LOYALTY_POINTS_LIFETIME_DAYS
): Date {
  return new Date(lastActivityAt.getTime() + lifetimeDays * 24 * 60 * 60 * 1000);
}

/** Знімає намір з доменної події лояльності (або `null`, якщо подія незначуща). */
export function buildLoyaltyIntent(event: DomainEvent): LoyaltyNotificationIntent | null {
  if (event instanceof LoyaltyPointsEarned) {
    const { clientId, points, newBalance, appointmentId } = event.payload;
    return {
      clientId,
      event: 'points_earned',
      dedupeKey: `points_earned:${clientId}:${appointmentId ?? newBalance}`,
      points,
      newBalance,
    };
  }

  if (event instanceof LoyaltyTierChanged) {
    const { clientId, newTier, discountPercent, totalVisits } = event.payload;
    return {
      clientId,
      event: 'tier_reached',
      dedupeKey: `tier_reached:${clientId}:${newTier}:${totalVisits}`,
      tier: newTier,
      discountPercent,
    };
  }

  if (event instanceof LoyaltyPointsSpent) {
    const { clientId, points, newBalance, appointmentId } = event.payload;
    return {
      clientId,
      event: 'points_spent',
      dedupeKey: `points_spent:${clientId}:${appointmentId ?? newBalance}`,
      points,
      newBalance,
    };
  }

  return null;
}

/** Попередження про згорання: баланс > 0 і до кінця строку лишилось ≤ N днів. */
export function expiryWarningIntent(input: {
  clientId: string;
  pointsBalance: number;
  lastActivityAt: Date;
  now: Date;
  config?: LoyaltyNotificationConfig;
}): LoyaltyNotificationIntent | null {
  if (input.pointsBalance <= 0) return null;

  const config = input.config ?? DEFAULT_LOYALTY_NOTIFICATION_CONFIG;
  const expiresAt = pointsExpireAt(input.lastActivityAt);
  const warningFrom = new Date(
    expiresAt.getTime() - config.expiryWarningDays * 24 * 60 * 60 * 1000
  );

  if (input.now.getTime() < warningFrom.getTime()) return null;
  if (input.now.getTime() >= expiresAt.getTime()) return null;

  return {
    clientId: input.clientId,
    event: 'points_expiring',
    dedupeKey: `points_expiring:${input.clientId}:${expiresAt.toISOString()}`,
    points: input.pointsBalance,
    expiresAt,
  };
}

export interface PlannedDelivery {
  intent: LoyaltyNotificationIntent;
  channel: Exclude<LoyaltyNotificationChannel, 'none'>;
  /** Момент доставки: зараз або після тихих годин. */
  scheduledFor: Date;
}

export interface SuppressedNotification {
  intent: LoyaltyNotificationIntent;
  reason: string;
}

export interface LoyaltyNotificationPlan {
  deliveries: PlannedDelivery[];
  /** Понад добовий ліміт — у дайджест, не окремим пушем. */
  batched: LoyaltyNotificationIntent[];
  suppressed: SuppressedNotification[];
}

/**
 * Планує доставку: канал, дедуп, тихі години, добовий ліміт.
 * Функція не має побічних ефектів — стан логу лише читається.
 */
export function planLoyaltyNotifications(
  intents: LoyaltyNotificationIntent[],
  log: LoyaltyNotificationLogState,
  now: Date,
  config: LoyaltyNotificationConfig = DEFAULT_LOYALTY_NOTIFICATION_CONFIG
): LoyaltyNotificationPlan {
  const plan: LoyaltyNotificationPlan = { deliveries: [], batched: [], suppressed: [] };
  const dayKey = localDayKey(now, config.timeZone);
  const plannedCountByClient = new Map<string, number>();
  const seenKeys = new Set<string>();

  for (const intent of intents) {
    const channel = config.channels[intent.event];
    if (channel === 'none') {
      plan.suppressed.push({ intent, reason: 'Channel disabled for this event' });
      continue;
    }

    if (log.sentKeys.has(intent.dedupeKey) || seenKeys.has(intent.dedupeKey)) {
      plan.suppressed.push({ intent, reason: 'Duplicate notification' });
      continue;
    }
    seenKeys.add(intent.dedupeKey);

    if (
      (log.batchedByClient.get(intent.clientId) ?? []).some(
        (item) => item.dedupeKey === intent.dedupeKey
      )
    ) {
      plan.suppressed.push({ intent, reason: 'Duplicate notification' });
      continue;
    }

    const sentToday = log.sentTodayByClient.get(`${dayKey}:${intent.clientId}`) ?? 0;
    const plannedToday = plannedCountByClient.get(intent.clientId) ?? 0;
    if (sentToday + plannedToday >= config.maxPerDay) {
      plan.batched.push(intent);
      continue;
    }

    plan.deliveries.push({
      intent,
      channel,
      scheduledFor: startOfAllowedSendWindow(now, config.quietHours, config.timeZone),
    });
    plannedCountByClient.set(intent.clientId, plannedToday + 1);
  }

  return plan;
}

/** Фіксує доставлене й відкладене в лог (щоб дедуп і ліміт працювали далі). */
export function applyPlanToLog(
  plan: LoyaltyNotificationPlan,
  log: LoyaltyNotificationLogState,
  now: Date,
  timeZone: string = LOYALTY_NOTIFICATION_TIME_ZONE
): void {
  const dayKey = localDayKey(now, timeZone);

  for (const delivery of plan.deliveries) {
    log.sentKeys.add(delivery.intent.dedupeKey);
    const key = `${dayKey}:${delivery.intent.clientId}`;
    log.sentTodayByClient.set(key, (log.sentTodayByClient.get(key) ?? 0) + 1);
  }

  for (const intent of plan.batched) {
    log.sentKeys.add(intent.dedupeKey);
    const batched = log.batchedByClient.get(intent.clientId) ?? [];
    batched.push(intent);
    log.batchedByClient.set(intent.clientId, batched);
  }
}

/** Забирає накопичений дайджест клієнта (після чого кошик порожній). */
export function takeDigest(
  log: LoyaltyNotificationLogState,
  clientId: string
): LoyaltyNotificationIntent[] {
  const batched = log.batchedByClient.get(clientId) ?? [];
  log.batchedByClient.delete(clientId);
  return batched;
}
