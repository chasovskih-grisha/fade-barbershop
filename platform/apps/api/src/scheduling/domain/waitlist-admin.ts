/* eslint-disable max-lines, complexity -- cohesive module (204 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: applyAdminAction, complexity 11 vs 10); refactor tracked in T-2500f */
// Керована черга очікування (T-4559): правила, які не залежать від сховища —
// пріоритет із VIP-вагою, каскад пропозицій, прострочення, відмова клієнта,
// ручні дії адміна та fuzzy-window підбір слота. Чистий домен: без Nest,
// Prisma і HTTP — усе, що потрібно, приходить аргументами.
import {
  OFFER_WINDOW_MINUTES,
  appendHistory,
  matchesConfiguration,
  priorityScore,
  rankEntries,
  type FreedSlot,
  type OperatorOverride,
  type WaitlistConfiguration,
  type WaitlistEntryData,
  type WaitlistEntryStatus,
} from './waitlist-queue';

export type { WaitlistEntryData, FreedSlot } from './waitlist-queue';

/** Копія заявки без soft-hold: прострочення/скасування мають його скинути. */
function withoutHold(entry: WaitlistEntryData): WaitlistEntryData {
  const rest = { ...entry };
  delete rest.holdExpiresAt;
  return rest;
}

/** Копія заявки без ручного рішення та soft-hold (рівень адміна «demote»). */
function withoutOverrides(entry: WaitlistEntryData): WaitlistEntryData {
  const rest = { ...entry };
  delete rest.override;
  delete rest.holdExpiresAt;
  return rest;
}

/** Скільки кандидатів одночасно отримують пропозицію (overbooking-lite). */
export const MAX_CASCADE_OFFERS = 3;

/** Дії адміна над заявкою (T-4559). */
export type WaitlistAdminAction = 'promote' | 'demote' | 'pause' | 'resume' | 'transfer';

export interface WaitlistAdminInput {
  by: string;
  reason: string;
  at?: Date;
  /** Для `transfer`: локація, куди переїжджає клієнт. */
  targetLocationId?: string;
}

/** Рядок черги для адмінки: пріоритет видно й пояснено. */
export interface WaitlistQueueRow {
  id: string;
  clientId: string;
  priority: number;
  waitingMinutes: number;
  status: WaitlistEntryStatus;
  configuration: WaitlistConfiguration;
  overrideReason: string | null;
}

/** Одна пропозиція каскаду з власним soft-hold. */
export interface CascadeOffer {
  entry: WaitlistEntryData;
  rank: number;
  holdExpiresAt: Date;
}

const minutesBetween = (from: Date, to: Date): number =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));

/** Заявки, які ще беруть участь у черзі (закриті не показуємо). */
function isActive(entry: WaitlistEntryData): boolean {
  return entry.status === 'waiting' || entry.status === 'offered' || entry.status === 'paused';
}

/** Черга адміна: пріоритет спадає, далі — хто чекає довше (FIFO). */
export function adminQueueRows(
  entries: WaitlistEntryData[],
  score: (entry: WaitlistEntryData) => number = priorityScore,
  now: Date = new Date()
): WaitlistQueueRow[] {
  return entries
    .filter(isActive)
    .slice()
    .sort((a, b) => score(b) - score(a) || a.waitingSince.getTime() - b.waitingSince.getTime())
    .map((entry) => ({
      id: entry.id,
      clientId: entry.clientId,
      priority: score(entry),
      waitingMinutes: minutesBetween(entry.waitingSince, now),
      status: entry.status,
      configuration: entry.configuration,
      overrideReason: entry.override?.reason ?? null,
    }));
}

/** Каскад: топ-N кандидатів отримують слот одночасно, кожен зі своїм hold. */
export function planOfferCascade(
  entries: WaitlistEntryData[],
  slot: FreedSlot,
  options: { now: Date; count?: number; windowMinutes?: number }
): CascadeOffer[] {
  const limit = Math.min(options.count ?? MAX_CASCADE_OFFERS, MAX_CASCADE_OFFERS);
  if (limit <= 0) return [];
  const holdMinutes = options.windowMinutes ?? OFFER_WINDOW_MINUTES;
  const holdExpiresAt = new Date(options.now.getTime() + holdMinutes * 60_000);

  return rankEntries(entries, slot)
    .slice(0, limit)
    .map((entry, index) => ({
      entry: {
        ...entry,
        status: 'offered',
        holdExpiresAt,
        history: appendHistory(entry, { action: 'offered', at: options.now }),
      },
      rank: index + 1,
      holdExpiresAt,
    }));
}

/** Таймер: прострочені пропозиції закриваються, hold знімається (WTL-004). */
export function expireOffersWithReleases(
  entries: WaitlistEntryData[],
  now: Date
): { entries: WaitlistEntryData[]; expiredIds: string[] } {
  const expiredIds: string[] = [];
  const updated = entries.map((entry) => {
    if (entry.status !== 'offered') return entry;
    if (entry.holdExpiresAt === undefined) return entry;
    if (entry.holdExpiresAt.getTime() > now.getTime()) return entry;

    expiredIds.push(entry.id);
    const rest = withoutHold(entry);
    return {
      ...rest,
      status: 'expired' as const,
      history: appendHistory(rest, { action: 'expired', at: now }),
    };
  });
  return { entries: updated, expiredIds };
}

/**
 * Відмова клієнта: заявка закривається, активний hold звільняється негайно.
 * Повторна відмова не змінює заявку (ідемпотентно), виконану — заборонено.
 */
export function cancelByClient(
  entry: WaitlistEntryData,
  input: { by: string; reason?: string; at?: Date }
): { entry: WaitlistEntryData; releasedHold: boolean } {
  if (entry.status === 'fulfilled') {
    throw new Error(`Waitlist entry ${entry.id} is already fulfilled`);
  }
  if (entry.status === 'cancelled') return { entry, releasedHold: false };

  const releasedHold = entry.status === 'offered' && entry.holdExpiresAt !== undefined;
  const at = input.at ?? new Date();
  const rest = withoutHold(entry);
  return {
    entry: {
      ...rest,
      status: 'cancelled',
      history: appendHistory(rest, {
        action: 'cancelled',
        at,
        by: input.by,
        ...(input.reason === undefined ? {} : { reason: input.reason }),
      }),
    },
    releasedHold,
  };
}

/** Ручна дія адміна: причина й оператор обов'язкові, кожен крок у журналі. */
export function applyAdminAction(
  entry: WaitlistEntryData,
  action: WaitlistAdminAction,
  input: WaitlistAdminInput
): { entry: WaitlistEntryData; log: string } {
  const by = input.by.trim();
  if (by === '') throw new Error('Waitlist admin action requires an operator id');
  const reason = input.reason.trim();
  if (reason === '') throw new Error(`Waitlist admin action ${action} requires a reason`);

  const at = input.at ?? new Date();
  const log = `waitlist.admin.${action} by=${by} reason=${reason}`;
  const historyEntry = { action, at, by, reason };

  switch (action) {
    case 'promote': {
      const override: OperatorOverride = { by, reason, at };
      return {
        entry: { ...entry, override, history: appendHistory(entry, historyEntry) },
        log,
      };
    }
    case 'demote': {
      const rest = withoutOverrides(entry);
      return {
        entry: {
          ...rest,
          manualBias: -100,
          history: appendHistory(rest, historyEntry),
        },
        log,
      };
    }
    case 'pause': {
      const rest = withoutHold(entry);
      return {
        entry: { ...rest, status: 'paused', history: appendHistory(rest, historyEntry) },
        log,
      };
    }
    case 'resume':
      return {
        entry: { ...entry, status: 'waiting', history: appendHistory(entry, historyEntry) },
        log,
      };
    case 'transfer': {
      const target = input.targetLocationId?.trim();
      if (target === undefined || target === '') {
        throw new Error('Waitlist transfer requires a target location');
      }
      return {
        entry: {
          ...entry,
          configuration: { ...entry.configuration, locationId: target },
          history: appendHistory(entry, historyEntry),
        },
        log,
      };
    }
  }
}

/** Fuzzy window (ADR 0012): найраніший слот у межах вікна клієнта. */
export function selectBestSlot(
  configuration: WaitlistConfiguration,
  slots: FreedSlot[]
): FreedSlot | null {
  const matching = slots
    .filter((slot) => matchesConfiguration(configuration, slot))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  return matching[0] ?? null;
}
