// Черга листа очікування (T-170a): вибір наступного за FIFO-конфігурацією,
// soft-hold 15 хв і анти-спам (ADR 0012 §2–§5, WTL-002/003/005). Порядок — за
// часом очікування цієї самої конфігурації, а не за пріоритетом клієнта:
// конфігурація = локація + послуга + барбер/«Будь-який» + вікно дат + точність.
// Чистий домен: без Nest, Prisma і HTTP.

export type WaitlistEntryStatus =
  'waiting' | 'offered' | 'booked' | 'expired' | 'cancelled' | 'paused';

export interface WaitlistConfiguration {
  locationId: string;
  serviceId: string;
  /** `null` — «Будь-який барбер» (WTL-001). */
  barberId: string | null;
  /** Вікно дат `YYYY-MM-DD`, включно з обома кінцями. */
  windowFrom: string;
  windowTo: string;
  /** `exact` — ±30 хв; `flexible` — будь-який слот цієї конфігурації (WTL-001). */
  precision: 'exact' | 'flexible';
}

export interface WaitlistEntryData {
  id: string;
  clientId: string;
  configuration: WaitlistConfiguration;
  status: WaitlistEntryStatus;
  waitingSince: Date;
  /** Скільки пропозицій поспіль прострочено чи пропущено (WTL-005). */
  consecutiveMisses: number;
  holdExpiresAt?: Date;
}

/** Звільнений слот, для якого шукаємо чергу (події Cancelled/NoShowed). */
export interface FreedSlot {
  locationId: string;
  serviceId: string;
  barberId: string;
  /** `YYYY-MM-DD` у зоні локації. */
  date: string;
  start: string; // 'HH:MM'
}

export const OFFER_WINDOW_MINUTES = 15;
export const MAX_CONSECUTIVE_MISSES = 3;

/** Слот відповідає конфігурації: локація, послуга, барбер/«Будь-який», вікно дат. */
export function matchesConfiguration(
  configuration: WaitlistConfiguration,
  slot: FreedSlot
): boolean {
  if (configuration.locationId !== slot.locationId) return false;
  if (configuration.serviceId !== slot.serviceId) return false;
  if (configuration.barberId !== null && configuration.barberId !== slot.barberId) return false;
  return configuration.windowFrom <= slot.date && slot.date <= configuration.windowTo;
}

/** Перший за часом очікування серед тих, хто чекає цю конфігурацію (WTL-002). */
export function selectNextEntry(
  entries: WaitlistEntryData[],
  slot: FreedSlot
): WaitlistEntryData | null {
  let oldest: WaitlistEntryData | null = null;
  for (const entry of entries) {
    if (entry.status !== 'waiting') continue;
    if (!matchesConfiguration(entry.configuration, slot)) continue;
    if (oldest === null || entry.waitingSince.getTime() < oldest.waitingSince.getTime()) {
      oldest = entry;
    }
  }
  return oldest;
}

/** Пропозиція зі soft-hold 15 хв: слот не показується вільним іншим (WTL-003). */
export function offerSlot(entry: WaitlistEntryData, now: Date): WaitlistEntryData {
  return {
    ...entry,
    status: 'offered',
    holdExpiresAt: new Date(now.getTime() + OFFER_WINDOW_MINUTES * 60_000),
  };
}

/** Прострочені пропозиції закриваються, hold знімається (WTL-004). */
export function expireOffers(entries: WaitlistEntryData[], now: Date): WaitlistEntryData[] {
  return entries.map((entry) =>
    entry.status === 'offered' &&
    entry.holdExpiresAt !== undefined &&
    entry.holdExpiresAt.getTime() <= now.getTime()
      ? { ...entry, status: 'expired' as const }
      : entry
  );
}

/** Неспрацювання (прострочив чи пропустив): 3 поспіль → черга на паузі (WTL-005). */
export function registerMiss(entry: WaitlistEntryData): WaitlistEntryData {
  const misses = entry.consecutiveMisses + 1;
  return {
    id: entry.id,
    clientId: entry.clientId,
    configuration: entry.configuration,
    waitingSince: entry.waitingSince,
    consecutiveMisses: misses,
    status: misses >= MAX_CONSECUTIVE_MISSES ? 'paused' : 'waiting',
  };
}
