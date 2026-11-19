// Порт черги очікування (T-170…T-182): use cases бачать лише ці операції,
// зберігання живе в інфраструктурі. Тут навмисно вузький контракт — рівно те,
// що споживають сценарії waitlist, без Prisma й без HTTP.
import type { SlotHold, WaitlistEntry } from '../../waitlist/waitlist.domain';

export type { SlotHold, WaitlistEntry };

/** Що шукає клієнт: послуги, розмір групи, бажана дата. */
export interface SlotSearchCriteria {
  serviceIds: string[];
  groupSize?: number;
  preferredDate?: string;
  locationId?: string;
}

/** Слот, придатний для бронювання (T-174 batch selection). */
export interface AvailableSlot {
  id: string;
  barberId: string;
  serviceId?: string;
  startTime: string;
}

/** Деталі слоту для підтвердження/прийняття (T-176). */
export interface SlotDetails extends AvailableSlot {
  locationId?: string;
  durationMinutes?: number;
}

/** Місце клієнта в черзі (T-178). */
export interface WaitlistPosition {
  position: number;
  totalInQueue?: number;
  estimatedWaitMinutes?: number;
}

/** Запис, який ставить клієнта в чергу. */
export interface WaitlistEntryInput {
  id: string;
  clientId: string;
  serviceId?: string;
  locationId?: string;
  barberId?: string;
  addedAt?: Date;
  waitingSince?: Date;
  status?: string;
  configuration?: unknown;
  consecutiveMisses?: number;
}

export interface WaitlistQueue {
  getAvailableSlots(criteria: SlotSearchCriteria): Promise<AvailableSlot[]>;
  getSlotDetails(slotId: string): Promise<SlotDetails | null>;
  addEntry(entry: WaitlistEntryInput): Promise<WaitlistEntry>;
  registerMiss(entry: WaitlistEntryInput): Promise<WaitlistEntry & { consecutiveMisses?: number }>;
  removeEntry(entryId: string): Promise<void>;
  moveToFront(entryId: string): Promise<void>;
  getActiveEntry(clientId: string): Promise<WaitlistEntry | null>;
  getActiveEntryCount(): Promise<number>;
  getAllEntriesWithPriority(): Promise<WaitlistEntry[]>;
  getPosition(clientId: string): Promise<WaitlistPosition | null>;
  getHoldHistory(hours: number): Promise<SlotHold[]>;
  getRecentEntries(limit: number): Promise<WaitlistEntry[]>;
  markSlotAsBooked(slotId: string): Promise<void>;
  continueCascade(slotId: string, reason: string): Promise<void>;
  triggerManualCascade(slotId: string, reason?: string): Promise<unknown>;
}

// ─── Чиста черга й пріоритети (T-170a, T-4453) ───────────────────────────────
//
// Модуль лишається вільним від Prisma/HTTP: вибір кандидата, soft-hold і
// анти-спам — це рішення домену. Інфраструктура лише зберігає результат.
//
// T-4453: FIFO — базовий порядок, але не єдиний. Пріоритет рахується
// конструктивно з даних заявки (лояльність клієнта, точність вікна, кількість
// невдалих пропозицій) і може бути піднятий оператором вручну з причиною.

/** Конфігурація, яку клієнт шукає (ADR 0012). */
export interface WaitlistConfiguration {
  locationId: string;
  serviceId: string;
  /** `null` — «будь-який барбер» (WTL-001). */
  barberId?: string | null;
  /** Скільки місць шукає група; без значення — 1. */
  groupSize?: number;
  /** Вікно дат, ISO `YYYY-MM-DD`, включно. */
  windowFrom: string;
  windowTo: string;
  /** `exact` — конкретна дата, `range` — діапазон (впливає на пріоритет). */
  precision: 'exact' | 'range';
}

/** Звільнений слот, який можна запропонувати (не бронювання, ADR 0012). */
export interface FreedSlot {
  locationId: string;
  serviceId: string;
  barberId?: string;
  /** ISO `YYYY-MM-DD` (у поясі локації). */
  date: string;
  /** `HH:MM` локальний час початку. */
  start: string;
  /** Скільки місць у слоті; без значення — 1. */
  groupSize?: number;
}

export type WaitlistEntryStatus =
  | 'waiting'
  | 'offered'
  | 'expired'
  | 'paused'
  | 'fulfilled'
  /** T-4559: клієнт сам відмовився від черги. */
  | 'cancelled';

/** Ручне втручання оператора (T-4453): підняти заявку з причиною і логом. */
export interface OperatorOverride {
  by: string;
  reason: string;
  at: Date;
}

export interface WaitlistEntryData {
  id: string;
  clientId: string;
  configuration: WaitlistConfiguration;
  status: WaitlistEntryStatus;
  waitingSince: Date;
  consecutiveMisses: number;
  /** Коли спливає soft-hold, якщо заявку вже запропоновано (WTL-003/005). */
  holdExpiresAt?: Date;
  /** Дані лояльності з crm (T-061) — без дублювання сховища. */
  completedVisits?: number;
  /** Піднятий оператором вручну; причина обовʼязкова для аудиту. */
  override?: OperatorOverride;
  /** T-4559: рівень лояльності (BRONZE…PLATINUM) з crm — вага пріоритету. */
  vipTier?: string;
  /** T-4559: ручне зміщення оператором (+/-); причина — в history. */
  manualBias?: number;
  /** T-4559: журнал дій (каскад, відмова, дії адміна). */
  history?: WaitlistEntryHistoryEntry[];
}

/** Запис журналу заявки: хто/коли/чому (T-4559, audit). */
export interface WaitlistEntryHistoryEntry {
  at: Date;
  action: string;
  by: string;
  reason: string;
}

/** Soft-hold на пропозицію: 15 хвилин (WTL-003/005). */
export const OFFER_WINDOW_MINUTES = 15;

/** Третє поспіль неспрацювання ставить чергу на паузу (WTL-005). */
export const MAX_CONSECUTIVE_MISSES = 3;

/** Ваги пріоритету: однакові для всіх локацій, доки нема налаштувань. */
export const PRIORITY_WEIGHTS = {
  /** +5 за кожен завершений візит, не більше +20. */
  loyaltyPerVisit: 5,
  loyaltyCap: 20,
  /** Точна дата або вузьке вікно (≤ 3 днів) — клієнту важливіше. */
  exactDateBonus: 4,
  narrowWindowBonus: 2,
  narrowWindowDays: 3,
  /** Кожне неспрацювання опускає заявку нижче (WTL-005). */
  missPenalty: 5,
  /** Ручне підняття оператором переважає будь-яку конструктивну вагу. */
  operatorBoost: 100,
} as const;

/** T-4559: вага рівня лояльності; PLATINUM обходить звичайну чергу. */
export const VIP_TIER_BONUS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 2,
  GOLD: 5,
  PLATINUM: 8,
};

function vipBonus(tier: string | undefined): number {
  if (!tier) return 0;
  return VIP_TIER_BONUS[tier.toUpperCase()] ?? 0;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayCount(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return Number.POSITIVE_INFINITY;
  return Math.round((end - start) / DAY_MS);
}

/** Чи підходить слот під конфігурацію заявки (WTL-001/002). */
export function matchesConfiguration(
  configuration: WaitlistConfiguration,
  slot: FreedSlot
): boolean {
  if (configuration.locationId !== slot.locationId) return false;
  if (configuration.serviceId !== slot.serviceId) return false;

  if (configuration.barberId != null && configuration.barberId !== slot.barberId) {
    return false;
  }

  if (slot.date < configuration.windowFrom || slot.date > configuration.windowTo) return false;

  const wanted = configuration.groupSize ?? 1;
  const available = slot.groupSize ?? 1;
  return wanted <= available;
}

/**
 * Пріоритет заявки (T-4453): вищий — раніше. FIFO лишається тай-брейкером,
 * тож рівні за вагою заявки обслуговуються за часом очікування.
 */
export function priorityScore(entry: WaitlistEntryData): number {
  let score = 0;

  const visits = Math.max(0, entry.completedVisits ?? 0);
  score += Math.min(PRIORITY_WEIGHTS.loyaltyCap, visits * PRIORITY_WEIGHTS.loyaltyPerVisit);

  const span = dayCount(entry.configuration.windowFrom, entry.configuration.windowTo);
  if (entry.configuration.precision === 'exact' || span === 0) {
    score += PRIORITY_WEIGHTS.exactDateBonus;
  } else if (span <= PRIORITY_WEIGHTS.narrowWindowDays) {
    score += PRIORITY_WEIGHTS.narrowWindowBonus;
  }

  score -= Math.max(0, entry.consecutiveMisses) * PRIORITY_WEIGHTS.missPenalty;

  score += vipBonus(entry.vipTier);
  score += entry.manualBias ?? 0;

  if (entry.override) score += PRIORITY_WEIGHTS.operatorBoost;

  return score;
}

/** Кандидати, відсортовані за пріоритетом і часом очікування. */
export function rankEntries(entries: WaitlistEntryData[], slot: FreedSlot): WaitlistEntryData[] {
  return entries
    .filter((entry) => entry.status === 'waiting' && matchesConfiguration(entry.configuration, slot))
    .sort((a, b) => {
      const byScore = priorityScore(b) - priorityScore(a);
      if (byScore !== 0) return byScore;
      return a.waitingSince.getTime() - b.waitingSince.getTime();
    });
}

/** Наступний кандидат на слот; `null` — черга не має підходящих заявок. */
export function selectNextEntry(
  entries: WaitlistEntryData[],
  slot: FreedSlot
): WaitlistEntryData | null {
  return rankEntries(entries, slot)[0] ?? null;
}

/** Пропозиція ставить soft-hold на 15 хвилин (WTL-003/005). */
export function offerSlot(
  entry: WaitlistEntryData,
  now: Date,
  windowMinutes: number = OFFER_WINDOW_MINUTES
): WaitlistEntryData {
  return {
    ...entry,
    status: 'offered',
    holdExpiresAt: new Date(now.getTime() + windowMinutes * 60_000),
  };
}

/** Прострочені пропозиції закриваються, активні лишаються (WTL-004). */
export function expireOffers(entries: WaitlistEntryData[], now: Date): WaitlistEntryData[] {
  return entries.map((entry) => {
    if (entry.status !== 'offered' || !entry.holdExpiresAt) return entry;
    if (entry.holdExpiresAt.getTime() > now.getTime()) return entry;
    const expired: WaitlistEntryData = { ...entry, status: 'expired' };
    delete expired.holdExpiresAt;
    return expired;
  });
}

/** Неспрацювання: лічильник росте, на третьому — пауза (WTL-005). */
export function registerMiss(entry: WaitlistEntryData): WaitlistEntryData {
  const consecutiveMisses = entry.consecutiveMisses + 1;
  return {
    ...entry,
    consecutiveMisses,
    status: consecutiveMisses >= MAX_CONSECUTIVE_MISSES ? 'paused' : entry.status,
  };
}

/**
 * Ручне втручання оператора (T-4453): заявка піднімається, причина
 * фіксується для аудиту. Порожня причина — помилка, а не «тихе» підняття.
 */
export function applyOperatorOverride(
  entry: WaitlistEntryData,
  override: OperatorOverride
): { entry: WaitlistEntryData; log: string } {
  if (!override.reason.trim()) throw new Error('Operator override requires a reason');
  if (!override.by.trim()) throw new Error('Operator override requires an operator id');

  const updated: WaitlistEntryData = { ...entry, override };
  const log = `${override.at.toISOString()} waitlist.override entry=${entry.id} by=${override.by} reason=${override.reason}`;
  return { entry: updated, log };
}

/**
 * Акцепт пропозиції (T-4453): лише в межах soft-hold. Повертає заявку в
 * стані `fulfilled`; запис створює booking-флоу за звичайними правилами
 * (нова `AgreedPrice`, поточні знижки — ADR 0012).
 */
export function acceptOffer(entry: WaitlistEntryData, now: Date): WaitlistEntryData {
  if (entry.status !== 'offered' || !entry.holdExpiresAt) {
    throw new Error(`Waitlist entry ${entry.id} has no active offer`);
  }
  if (entry.holdExpiresAt.getTime() <= now.getTime()) {
    throw new Error(`Waitlist offer for ${entry.id} has expired`);
  }
  const fulfilled: WaitlistEntryData = { ...entry, status: 'fulfilled' };
  delete fulfilled.holdExpiresAt;
  return fulfilled;
}
