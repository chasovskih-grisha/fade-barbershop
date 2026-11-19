/**
 * T-4559: керована черга очікування — життєвий цикл пропозицій, відмова
 * клієнта, ручне керування адміном і підгонка слота у вікно.
 *
 * Базові правила (пріоритет, soft-hold, miss-політика) — у `waitlist-queue.ts`
 * (T-170a/T-4453). Тут — розширення без паралельних абстракцій:
 *  - VIP-вага й ручне зміщення вже враховані в `priorityScore`;
 *  - каскад кільком клієнтам одразу (overbooking-lite) з лімітом;
 *  - `OfferExpired` → наступний кандидат отримує пропозицію;
 *  - клієнт скасовує очікування — hold звільняється негайно;
 *  - адмін піднімає/опускає/ставить на паузу/переводить між локаціями
 *    з обов'язковою причиною й журналом;
 *  - нечітке вікно (ADR 0012): вибір найранішого слота в межах вікна.
 */
import {
  OFFER_WINDOW_MINUTES,
  expireOffers,
  matchesConfiguration,
  offerSlot,
  rankEntries,
  type FreedSlot,
  type WaitlistConfiguration,
  type WaitlistEntryData,
  type WaitlistEntryHistoryEntry,
} from './waitlist-queue';

/** Скільки пропозицій одночасно пускає каскад (overbooking-lite). */
export const MAX_CASCADE_OFFERS = 3;

export type WaitlistAdminAction = 'promote' | 'demote' | 'pause' | 'resume' | 'transfer';

export type WaitlistHistoryEntry = WaitlistEntryHistoryEntry;

export interface WaitlistAdminInput {
  by: string;
  reason: string;
  at?: Date;
  /** Обов'язковий для `transfer`. */
  targetLocationId?: string;
}

export interface CascadeOffer {
  entry: WaitlistEntryData;
  rank: number;
  holdExpiresAt: Date;
}

function appendHistory(
  entry: WaitlistEntryData,
  history: WaitlistHistoryEntry[],
  item: WaitlistHistoryEntry
): WaitlistEntryData {
  return { ...entry, history: [...history, item] };
}

/**
 * План каскаду: топ-N за пріоритетом отримують пропозиції одночасно.
 * Ліміт захищає від «роздачі» одного слота всій черзі; кожен кандидат
 * отримує власний soft-hold.
 */
export function planOfferCascade(
  entries: WaitlistEntryData[],
  slot: FreedSlot,
  options: { now: Date; count?: number; windowMinutes?: number } = { now: new Date() }
): CascadeOffer[] {
  const count = Math.max(1, options.count ?? MAX_CASCADE_OFFERS);
  const ranked = rankEntries(entries, slot).slice(0, count);

  return ranked.map((entry, index) => {
    const offered = offerSlot(entry, options.now, options.windowMinutes ?? OFFER_WINDOW_MINUTES);
    return {
      entry: {
        ...offered,
        history: [
          ...(entry.history ?? []),
          {
            at: options.now,
            action: 'offered',
            by: 'system',
            reason: `cascade rank ${index + 1}`,
          },
        ],
      },
      rank: index + 1,
      holdExpiresAt: offered.holdExpiresAt as Date,
    };
  });
}

/**
 * Закриває прострочені пропозиції й повертає їхні id — виклик каскадує
 * наступного кандидата (WTL-004: OfferExpired → наступний).
 */
export function expireOffersWithReleases(
  entries: WaitlistEntryData[],
  now: Date
): { entries: WaitlistEntryData[]; expiredIds: string[] } {
  const updated = expireOffers(entries, now).map((entry, index) => {
    if (entry.status !== 'expired' || entries[index]?.status !== 'offered') return entry;
    return {
      ...entry,
      history: [
        ...(entry.history ?? []),
        { at: now, action: 'expired', by: 'system', reason: 'offer hold expired' },
      ],
    };
  });
  const expiredIds = updated
    .filter((entry, index) => entry.status === 'expired' && entries[index]?.status === 'offered')
    .map((entry) => entry.id);
  return { entries: updated, expiredIds };
}

/** Клієнт скасовує очікування: hold звільняється негайно. */
export function cancelByClient(
  entry: WaitlistEntryData,
  input: { by: string; at?: Date; reason?: string }
): { entry: WaitlistEntryData; releasedHold: boolean } {
  if (entry.status === 'fulfilled') {
    throw new Error(`Waitlist entry ${entry.id} is already fulfilled and cannot be cancelled`);
  }
  if (entry.status === 'cancelled') return { entry, releasedHold: false };

  const at = input.at ?? new Date();
  const releasedHold = entry.status === 'offered' && Boolean(entry.holdExpiresAt);

  const cancelled: WaitlistEntryData = {
    ...entry,
    status: 'cancelled',
  };
  delete cancelled.holdExpiresAt;

  return {
    entry: appendHistory(
      cancelled,
      entry.history ?? [],
      { at, action: 'cancelled', by: input.by, reason: input.reason ?? 'Client cancelled waitlist' }
    ),
    releasedHold,
  };
}

/**
 * Ручні дії адміна. Причина обов'язкова для всіх, крім `resume` (повернення
 * на паузі — це відновлення раніше зафіксованого рішення, але причина теж
 * потрібна: журнал має бути повним).
 */
export function applyAdminAction(
  entry: WaitlistEntryData,
  action: WaitlistAdminAction,
  input: WaitlistAdminInput
): { entry: WaitlistEntryData; log: string } {
  if (!input.by.trim()) throw new Error('Waitlist admin action requires an operator id');
  if (!input.reason.trim()) throw new Error('Waitlist admin action requires a reason');

  const at = input.at ?? new Date();
  const history: WaitlistHistoryEntry[] = [
    ...(entry.history ?? []),
    { at, action, by: input.by, reason: input.reason },
  ];

  switch (action) {
    case 'promote': {
      // Один +100 за ручне підняття: override дає operatorBoost, без
      // дублювання в manualBias.
      const promoted: WaitlistEntryData = {
        ...entry,
        override: { by: input.by, reason: input.reason, at },
      };
      promoted.history = history;
      return { entry: promoted, log: actionLog(entry, action, input.by, at) };
    }
    case 'demote': {
      // Знімаємо ручне підняття й опускаємо заявку нижче конструктивної ваги.
      const demoted: WaitlistEntryData = {
        ...entry,
        manualBias: (entry.manualBias ?? 0) - 100,
      };
      delete demoted.override;
      demoted.history = history;
      return { entry: demoted, log: actionLog(entry, action, input.by, at) };
    }
    case 'pause': {
      const paused: WaitlistEntryData = { ...entry, status: 'paused', history };
      delete paused.holdExpiresAt;
      return { entry: paused, log: actionLog(entry, action, input.by, at) };
    }
    case 'resume': {
      const resumed: WaitlistEntryData = { ...entry, status: 'waiting', history };
      delete resumed.holdExpiresAt;
      return { entry: resumed, log: actionLog(entry, action, input.by, at) };
    }
    case 'transfer': {
      const target = input.targetLocationId?.trim();
      if (!target) throw new Error('Transfer requires a target location');
      const configuration: WaitlistConfiguration = {
        ...entry.configuration,
        locationId: target,
      };
      return {
        entry: { ...entry, configuration, history },
        log: actionLog(entry, `${action}:${target}`, input.by, at),
      };
    }
  }
}

function actionLog(
  entry: WaitlistEntryData,
  action: string,
  by: string,
  at: Date
): string {
  return `${at.toISOString()} waitlist.admin.${action} entry=${entry.id} by=${by}`;
}

/** Найраніший слот, що підходить під вікно клієнта (ADR 0012, fuzzy window). */
export function selectBestSlot(
  configuration: WaitlistConfiguration,
  slots: FreedSlot[]
): FreedSlot | null {
  const matching = slots
    .filter((slot) => matchesConfiguration(configuration, slot))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
    });
  return matching[0] ?? null;
}

export interface WaitlistQueueRow {
  id: string;
  clientId: string;
  status: string;
  priority: number;
  locationId: string;
  serviceId: string;
  waitingSince: Date;
  holdExpiresAt?: Date;
  paused: boolean;
}

/** Черга очима адміна: пріоритет → час очікування. */
export function adminQueueRows(
  entries: WaitlistEntryData[],
  score: (entry: WaitlistEntryData) => number
): WaitlistQueueRow[] {
  return entries
    .filter((entry) => entry.status === 'waiting' || entry.status === 'offered' || entry.status === 'paused')
    .map((entry) => {
      const row: WaitlistQueueRow = {
        id: entry.id,
        clientId: entry.clientId,
        status: entry.status,
        priority: score(entry),
        locationId: entry.configuration.locationId,
        serviceId: entry.configuration.serviceId,
        waitingSince: entry.waitingSince,
        paused: entry.status === 'paused',
      };
      if (entry.holdExpiresAt) row.holdExpiresAt = entry.holdExpiresAt;
      return row;
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.waitingSince.getTime() - b.waitingSince.getTime();
    });
}
