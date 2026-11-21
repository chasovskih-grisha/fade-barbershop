/* eslint-disable max-lines -- cohesive module (420 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Черга листа очікування (T-170a): вибір наступного за FIFO-конфігурацією,
// soft-hold 15 хв і анти-спам (ADR 0012 §2–§5, WTL-002/003/005). Порядок — за
// часом очікування цієї самої конфігурації, а не за пріоритетом клієнта:
// конфігурація = локація + послуга + барбер/«Будь-який» + вікно дат + точність.
// Чистий домен: без Nest, Prisma і HTTP.

/** Копія заявки без soft-hold: прийняття пропозиції закриває hold. */
function withoutHold(entry: WaitlistEntryData): WaitlistEntryData {
  const rest = { ...entry };
  delete rest.holdExpiresAt;
  return rest;
}

export type WaitlistEntryStatus =
  'waiting' | 'offered' | 'booked' | 'fulfilled' | 'expired' | 'cancelled' | 'paused';

/**
 * Точність запиту (WTL-001): `exact` — конкретний час (±30 хв), `range` —
 * будь-який слот у вікні дат, `flexible` — вікно + будь-який барбер.
 */
export type WaitlistPrecision = 'exact' | 'range' | 'flexible';

export interface WaitlistConfiguration {
  locationId: string;
  serviceId: string;
  /** `null` — «Будь-який барбер» (WTL-001). */
  barberId: string | null;
  /** Вікно дат `YYYY-MM-DD`, включно з обома кінцями. */
  windowFrom: string;
  windowTo: string;
  precision: WaitlistPrecision;
  /** Скільки місць шукає клієнт; відсутнє — одне (WTL-006). */
  groupSize?: number;
}

/** Ручне рішення оператора з обов'язковою причиною (T-4453). */
export interface OperatorOverride {
  by: string;
  reason: string;
  at?: Date;
}

/** Дії, які лишають слід у журналі заявки. */
export type WaitlistHistoryAction =
  | 'joined'
  | 'offered'
  | 'expired'
  | 'accepted'
  | 'cancelled'
  | 'promote'
  | 'demote'
  | 'pause'
  | 'resume'
  | 'transfer';

export interface WaitlistEntryHistoryEntry {
  action: WaitlistHistoryAction;
  at: Date;
  by?: string;
  reason?: string;
  detail?: string;
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
  /** Рівень лояльності клієнта: BRONZE/SILVER/GOLD/PLATINUM (WTL-001). */
  vipTier?: string;
  /** Ручне зміщення пріоритету оператором (T-4453); -100 — вниз черги. */
  manualBias?: number;
  /** Завершені візити клієнта — вага сталості (T-4453). */
  completedVisits?: number;
  /** Хто й чому підняв заявку вручну (T-4453). */
  override?: OperatorOverride;
  /** Журнал заявки для аудиту. */
  history?: WaitlistEntryHistoryEntry[];
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
  // Один звільнений слот — одне крісло: групі з 2+ місць не пропонуємо (WTL-006).
  if ((configuration.groupSize ?? 1) > 1) return false;
  return configuration.windowFrom <= slot.date && slot.date <= configuration.windowTo;
}

/** Вага рівня лояльності (WTL-001); невідомий рівень — без бонусу. */
const VIP_BONUS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 2,
  GOLD: 5,
  PLATINUM: 8,
};

/** Базова вага заявки: будь-який запит починає з неї. */
export const BASE_PRIORITY = 2;

/**
 * Пріоритет заявки (T-4453): VIP-рівень, сталість клієнта, пропущені
 * пропозиції, точність запиту й ручне зміщення. FIFO лишається лише
 * тай-брейком у `rankEntries`, а не самостійним правилом.
 */
export function priorityScore(entry: WaitlistEntryData): number {
  const tier = (entry.vipTier ?? '').toUpperCase();
  const vipBonus = VIP_BONUS[tier] ?? 0;
  const visitsBonus = Math.min(15, Math.max(0, entry.completedVisits ?? 0) * 3);
  const missPenalty = Math.max(0, entry.consecutiveMisses) * 5;
  const precisionBonus = entry.configuration.precision === 'exact' ? 5 : 0;
  const overrideBonus = entry.override === undefined ? 0 : 100;
  return (
    BASE_PRIORITY +
    vipBonus +
    visitsBonus -
    missPenalty +
    precisionBonus +
    overrideBonus +
    (entry.manualBias ?? 0)
  );
}

/**
 * Черга кандидатів на слот: спершу пріоритет, далі час очікування (FIFO).
 * Заявки, що не підходять під конфігурацію, не потрапляють у результат.
 */
export function rankEntries(entries: WaitlistEntryData[], slot: FreedSlot): WaitlistEntryData[] {
  return entries
    .filter((entry) => entry.status === 'waiting')
    .filter((entry) => matchesConfiguration(entry.configuration, slot))
    .sort(
      (a, b) =>
        priorityScore(b) - priorityScore(a) || a.waitingSince.getTime() - b.waitingSince.getTime()
    );
}

/** Наступний кандидат на слот: найвищий пріоритет, FIFO як тай-брейк (WTL-002). */
export function selectNextEntry(
  entries: WaitlistEntryData[],
  slot: FreedSlot
): WaitlistEntryData | null {
  return rankEntries(entries, slot)[0] ?? null;
}

/** Журнал: додати запис, не втрачаючи попередніх. */
export function appendHistory(
  entry: WaitlistEntryData,
  item: WaitlistEntryHistoryEntry
): WaitlistEntryHistoryEntry[] {
  return [...(entry.history ?? []), item];
}

/**
 * Оператор піднімає заявку вручну (T-4453): причина обов'язкова, рішення
 * фіксується в журналі, а пріоритет отримує фіксований бонус.
 */
export function applyOperatorOverride(
  entry: WaitlistEntryData,
  override: OperatorOverride
): { entry: WaitlistEntryData; log: string } {
  const reason = override.reason.trim();
  if (reason === '') throw new Error('Operator override requires a reason');
  const by = override.by.trim();
  if (by === '') throw new Error('Operator override requires an operator id');

  const at = override.at ?? new Date();
  const updated: WaitlistEntryData = {
    ...entry,
    override: { by, reason, at },
    history: appendHistory(entry, { action: 'promote', at, by, reason }),
  };
  return { entry: updated, log: `waitlist.override by=${by} reason=${reason}` };
}

/** Акцепт пропозиції: лише в межах hold, далі заявка закрита як виконана. */
export function acceptOffer(entry: WaitlistEntryData, now: Date): WaitlistEntryData {
  if (entry.holdExpiresAt === undefined || entry.holdExpiresAt.getTime() <= now.getTime()) {
    throw new Error(`Offer for waitlist entry ${entry.id} has expired`);
  }
  const rest = withoutHold(entry);
  return {
    ...rest,
    status: 'fulfilled',
    history: appendHistory(rest, { action: 'accepted', at: now }),
  };
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
    ...entry,
    consecutiveMisses: misses,
    status: misses >= MAX_CONSECUTIVE_MISSES ? 'paused' : 'waiting',
  };
}

// ---------------------------------------------------------------------------
// Порт черги для сценаріїв T-174…T-182: пошук слотів, позиція клієнта,
// історія утримань і каскад. Домен вище описує заявку й правила пріоритету;
// цей порт — те, що потрібно мобільному клієнту та адмінці.
// ---------------------------------------------------------------------------

/** Заявка в черзі у вигляді, потрібному сценаріям T-174…T-182. */
export interface WaitlistEntry {
  id: string;
  clientId: string;
  serviceId: string;
  addedAt: Date;
  status: string;
  clientName?: string;
  barberId?: string;
  barberName?: string;
  servicesRequested?: string[];
  priorityScore?: number;
  tier?: string;
  position?: number;
  waitTimeMinutes?: number;
}

/** Вхідні дані нової заявки. */
export interface WaitlistEntryInput {
  id: string;
  clientId: string;
  serviceId: string;
  addedAt: Date;
  status: string;
}

/** Вільний слот, який можна запропонувати з черги. */
export interface AvailableSlot {
  id: string;
  barberId: string;
  barberName?: string;
  serviceId: string;
  /** ISO-час початку слота. */
  startTime: string;
  priceCents?: number;
}

/** Критерії пошуку слотів для клієнта або групи. */
export interface SlotSearchCriteria {
  serviceIds?: string[];
  groupSize?: number;
  preferredDate?: string | null;
  barberId?: string | null;
  locationId?: string | null;
}

/** Слот із деталями, потрібними для підтвердження візиту. */
export interface SlotDetails {
  id: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  startTime: string;
}

/** Позиція клієнта в черзі та оцінка очікування. */
export interface WaitlistPositionInfo {
  position: number | null;
  estimatedWaitTime: number | null;
  queueUpdatedAt?: string;
  queueAddedAt?: string;
  /** Обчислений прiоритет заявки (T-180); без нього — 0. */
  priorityScore?: number;
}

/** Запис про утримання слота (каскад, підтвердження, прострочення). */
export interface SlotHoldRecord {
  slotId: string;
  clientId: string;
  heldAt: string;
  status: string;
  triggerType?: string;
  cascadeDepth?: number;
  estimatedWaitTime?: number;
  cancellationReason?: string | null;
  fifoCompliant?: boolean;
  releasedAt?: string | null;
  /** ISO-час, коли клiєнт став у чергу за цим слотом (T-181). */
  waitingSince?: string;
}

/** Рядок черги з обчисленим пріоритетом — для дашбордів і експорту. */
export interface PriorityEntry {
  entryId: string;
  clientId: string;
  clientName: string;
  position: number;
  priorityScore: number;
  waitTimeMinutes: number;
  rankSince: string;
  servicesRequested: string[];
  tier: string;
  addedAt: string;
}

/** Пропущена пропозиція слота (клієнт не відповів або відмовився). */
export interface WaitlistMissInput {
  id?: string;
  entryId: string;
  clientId?: string;
  slotId?: string;
  reason?: string;
  occurredAt?: Date;
}

/** Порт черги очікування. */
export abstract class WaitlistQueue {
  abstract getAvailableSlots(criteria: SlotSearchCriteria): Promise<AvailableSlot[]>;
  abstract getSlotDetails(slotId: string): Promise<SlotDetails | null>;
  abstract markSlotAsBooked(slotId: string): Promise<void>;
  abstract getPosition(clientId: string): Promise<WaitlistPositionInfo>;
  abstract getHoldHistory(windowHours: number): Promise<SlotHoldRecord[]>;
  abstract getActiveEntry(clientId: string): Promise<WaitlistEntry | null>;
  abstract getActiveEntryCount(): Promise<number>;
  abstract getAllEntriesWithPriority(): Promise<PriorityEntry[]>;
  abstract getRecentEntries(limit: number): Promise<WaitlistEntry[]>;
  abstract addEntry(entry: WaitlistEntryInput): Promise<void>;
  abstract removeEntry(entryId: string): Promise<boolean>;
  abstract moveToFront(entryId: string): Promise<void>;
  abstract registerMiss(input: WaitlistMissInput): Promise<{ consecutiveMisses: number }>;
  abstract continueCascade(slotId: string, reason: string): Promise<void>;
  abstract triggerManualCascade(slotId: string, reason: string): Promise<void>;
}

const QUEUE_MINUTE_MS = 60 * 1000;

/** Оцінка очікування: 25 хвилин на позицію (базовий час послуги + буфер). */
export function estimateMinutes(position: number | null): number | null {
  if (position === null || position <= 0) return null;
  return position * 25;
}

/**
 * Черга в пам'яті: детермінована поведінка для тестів і локальних сценаріїв.
 * Слоти приходять із явного списку, позиції рахуються в порядку додавання.
 */
export class InMemoryWaitlistQueue extends WaitlistQueue {
  private readonly entries = new Map<string, WaitlistEntry>();
  private readonly slots = new Map<string, AvailableSlot>();
  private readonly holds: SlotHoldRecord[] = [];
  private readonly booked = new Set<string>();
  private readonly misses = new Map<string, number>();

  constructor(slots: AvailableSlot[] = []) {
    super();
    for (const slot of slots) this.slots.set(slot.id, slot);
  }

  async getAvailableSlots(criteria: SlotSearchCriteria): Promise<AvailableSlot[]> {
    const serviceIds = criteria.serviceIds ?? [];
    const limit = criteria.groupSize ?? 1;
    return [...this.slots.values()]
      .filter((slot) => !this.booked.has(slot.id))
      .filter((slot) => serviceIds.length === 0 || serviceIds.includes(slot.serviceId))
      .filter((slot) => !criteria.barberId || slot.barberId === criteria.barberId)
      .filter(
        (slot) => !criteria.preferredDate || slot.startTime.slice(0, 10) === criteria.preferredDate
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, Math.max(1, limit));
  }

  async getSlotDetails(slotId: string): Promise<SlotDetails | null> {
    const slot = this.slots.get(slotId);
    if (!slot) return null;
    return {
      id: slot.id,
      barberId: slot.barberId,
      barberName: slot.barberName ?? slot.barberId,
      serviceId: slot.serviceId,
      startTime: slot.startTime,
    };
  }

  async markSlotAsBooked(slotId: string): Promise<void> {
    this.booked.add(slotId);
    this.recordHold(slotId, 'booked', { triggerType: 'manual' });
  }

  async getPosition(clientId: string): Promise<WaitlistPositionInfo> {
    const active = this.activeEntries();
    const index = active.findIndex((entry) => entry.clientId === clientId);
    if (index === -1) {
      return { position: null, estimatedWaitTime: null };
    }
    const queueAddedAt = active[index]?.addedAt?.toISOString();
    return {
      position: index + 1,
      estimatedWaitTime: estimateMinutes(index + 1),
      queueUpdatedAt: new Date().toISOString(),
      ...(queueAddedAt === undefined ? {} : { queueAddedAt }),
    };
  }

  async getHoldHistory(windowHours: number): Promise<SlotHoldRecord[]> {
    const cutoff = Date.now() - windowHours * 60 * QUEUE_MINUTE_MS;
    return this.holds.filter((hold) => new Date(hold.heldAt).getTime() >= cutoff);
  }

  async getActiveEntry(clientId: string): Promise<WaitlistEntry | null> {
    return this.activeEntries().find((entry) => entry.clientId === clientId) ?? null;
  }

  async getActiveEntryCount(): Promise<number> {
    return this.activeEntries().length;
  }

  async getAllEntriesWithPriority(): Promise<PriorityEntry[]> {
    return this.activeEntries().map((entry, index) => {
      const waitedMinutes = Math.floor((Date.now() - entry.addedAt.getTime()) / QUEUE_MINUTE_MS);
      return {
        entryId: entry.id,
        clientId: entry.clientId,
        clientName: entry.clientName ?? entry.clientId,
        position: index + 1,
        priorityScore: entry.priorityScore ?? defaultScore(index, waitedMinutes),
        waitTimeMinutes: waitedMinutes,
        rankSince: entry.addedAt.toISOString(),
        servicesRequested: entry.servicesRequested ?? [entry.serviceId],
        tier: entry.tier ?? 'regular',
        addedAt: entry.addedAt.toISOString(),
      };
    });
  }

  async getRecentEntries(limit: number): Promise<WaitlistEntry[]> {
    return this.activeEntries()
      .slice()
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, Math.max(0, limit));
  }

  async addEntry(entry: WaitlistEntryInput): Promise<void> {
    this.entries.set(entry.id, { ...entry, position: this.entries.size + 1 });
  }

  async removeEntry(entryId: string): Promise<boolean> {
    return this.entries.delete(entryId);
  }

  async moveToFront(entryId: string): Promise<void> {
    const entry = this.entries.get(entryId);
    if (!entry) return;
    const rest = [...this.entries.entries()].filter(([id]) => id !== entryId);
    this.entries.clear();
    this.entries.set(entryId, { ...entry, addedAt: new Date(0) });
    for (const [id, value] of rest) this.entries.set(id, value);
  }

  async registerMiss(input: WaitlistMissInput): Promise<{ consecutiveMisses: number }> {
    const entryId = input.entryId ?? input.id ?? '';
    const entry = this.entries.get(entryId);
    let consecutiveMisses = 0;
    if (entry) {
      consecutiveMisses = this.misses.get(entry.clientId) ?? 0;
      consecutiveMisses += 1;
      this.misses.set(entry.clientId, consecutiveMisses);
      this.entries.set(entryId, { ...entry, status: 'missed' });
    }
    if (input.slotId) {
      this.recordHold(input.slotId, 'expired', {
        triggerType: 'cascade',
        ...(input.reason === undefined ? {} : { cancellationReason: input.reason }),
        ...(input.clientId === undefined ? {} : { clientId: input.clientId }),
      });
    }
    return { consecutiveMisses };
  }

  async continueCascade(slotId: string, reason: string): Promise<void> {
    this.recordHold(slotId, 'expired', { triggerType: 'cascade', cancellationReason: reason });
  }

  async triggerManualCascade(slotId: string, reason: string): Promise<void> {
    this.recordHold(slotId, 'expired', { triggerType: 'manual', cancellationReason: reason });
  }

  private activeEntries(): WaitlistEntry[] {
    return [...this.entries.values()]
      .filter((entry) => entry.status === 'active' || entry.status === 'waiting')
      .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime());
  }

  private recordHold(slotId: string, status: string, extra: Partial<SlotHoldRecord>): void {
    this.holds.push({
      slotId,
      clientId: '',
      heldAt: new Date().toISOString(),
      status,
      fifoCompliant: true,
      ...extra,
    });
  }
}

/** Пріоритет за замовчуванням: черга + час очікування, обмежений 100. */
function defaultScore(index: number, waitedMinutes: number): number {
  const queuePart = Math.max(0, 60 - index * 5);
  const waitPart = Math.min(40, Math.floor(waitedMinutes / 60) * 5);
  return Math.min(100, queuePart + waitPart);
}
