// Порт черги очікування (T-170…T-182): use cases бачать лише ці операції,
// зберігання живе в інфраструктурі. Тут навмисно вузький контракт — рівно те,
// що споживають сценарії waitlist, без Prisma й без HTTP.
import type { SlotHold, WaitlistEntry } from '../../waitlist/waitlist.domain';

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
