// Політика доставки web push (T-4449): дедуплікація між поверхнями (мобайл/web),
// тихі години і згода. Чистий домен — без Nest/Prisma/HTTP.

export type PushSurface = 'mobile' | 'web';

export interface PushSubscriptionRef {
  surface: PushSurface;
  /** Сесія, до якої прив'язана підписка: дедуп між поверхнями однієї сесії. */
  sessionId: string;
}

export interface QuietHours {
  /** Хвилини від початку доби. */
  fromMinutes: number;
  toMinutes: number;
}

export interface PushDeliveryInput {
  consent: boolean;
  nowMinutes: number;
  quietHours: QuietHours;
  subscriptions: readonly PushSubscriptionRef[];
}

export type PushDeliveryReason = 'delivered' | 'no-consent' | 'quiet-hours' | 'no-subscriptions';

export interface PushDeliveryDecision {
  deliver: boolean;
  targets: PushSubscriptionRef[];
  reason: PushDeliveryReason;
}

// Мобайл — основний пул (T-080); за однакової сесії на двох поверхнях
// доставляємо один пуш, і мобайл має перевагу.
const SURFACE_PRIORITY: readonly PushSurface[] = ['mobile', 'web'];

const rank = (surface: PushSurface): number => SURFACE_PRIORITY.indexOf(surface);

/** Тихі години з заворотом через північ (from > to). */
export function isQuietHour(nowMinutes: number, quietHours: QuietHours): boolean {
  const { fromMinutes, toMinutes } = quietHours;
  if (fromMinutes === toMinutes) return false;
  return fromMinutes < toMinutes
    ? nowMinutes >= fromMinutes && nowMinutes < toMinutes
    : nowMinutes >= fromMinutes || nowMinutes < toMinutes;
}

/** Одна підписка на сесію: дві поверхні однієї сесії — один доставлений пуш. */
export function dedupeBySession(
  subscriptions: readonly PushSubscriptionRef[]
): PushSubscriptionRef[] {
  const bySession = new Map<string, PushSubscriptionRef>();
  for (const sub of subscriptions) {
    const current = bySession.get(sub.sessionId);
    if (!current || rank(sub.surface) < rank(current.surface)) {
      bySession.set(sub.sessionId, sub);
    }
  }
  return [...bySession.values()];
}

export function planPushDelivery(input: PushDeliveryInput): PushDeliveryDecision {
  if (!input.consent) return { deliver: false, targets: [], reason: 'no-consent' };
  if (input.subscriptions.length === 0) {
    return { deliver: false, targets: [], reason: 'no-subscriptions' };
  }
  if (isQuietHour(input.nowMinutes, input.quietHours)) {
    return { deliver: false, targets: [], reason: 'quiet-hours' };
  }
  return { deliver: true, targets: dedupeBySession(input.subscriptions), reason: 'delivered' };
}
