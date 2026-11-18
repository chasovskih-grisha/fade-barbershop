// Блокування часу адміном (T-4420): період поза графіком (обід, тренінг,
// зйомка) на барбера/крісло. Блок не генерує слотів і прибирає вже
// заплановані з доступності; причина обов'язкова, щоб календар мав підпис.
// Мінімум — не коротший за інтервал слота локації, інакше блок не має сенсу.

import { toMinutes } from './time-utils';

export interface TimeBlockData {
  id: string;
  barberId: string;
  locationId: string;
  start: string; // 'HH:MM'
  end: string; // 'HH:MM'
  reason: string;
  createdBy: string;
}

export class InvalidTimeBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTimeBlockError';
  }

  static of(message: string): InvalidTimeBlockError {
    return new InvalidTimeBlockError(message);
  }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutes(block: TimeBlockData): { start: number; end: number } {
  if (!TIME_RE.test(block.start) || !TIME_RE.test(block.end)) {
    throw InvalidTimeBlockError.of('Invalid time format');
  }
  return { start: toMinutes(block.start), end: toMinutes(block.end) };
}

/** Створити блок: тривалість не менша за мінімальний інтервал слота. */
export function createTimeBlock(block: TimeBlockData, minSlotMinutes: number): TimeBlockData {
  if (!block.reason.trim()) throw InvalidTimeBlockError.of('A block needs a reason');
  if (!Number.isInteger(minSlotMinutes) || minSlotMinutes <= 0) {
    throw InvalidTimeBlockError.of('Invalid minimum slot interval');
  }
  const span = minutes(block);
  if (span.end <= span.start) throw InvalidTimeBlockError.of('End must be after start');
  if (span.end - span.start < minSlotMinutes) {
    throw InvalidTimeBlockError.of('Block is shorter than the minimum slot interval');
  }
  return { ...block };
}

export interface SlotInterval {
  start: string; // 'HH:MM'
  end: string; // 'HH:MM'
}

/** Блок перекриває слоти — ті, що заходять у нього, з доступності прибираються. */
export function blocksSlot(block: TimeBlockData, slot: SlotInterval): boolean {
  const blockSpan = minutes(block);
  const slotSpan = { start: toMinutes(slot.start), end: toMinutes(slot.end) };
  return slotSpan.start < blockSpan.end && blockSpan.start < slotSpan.end;
}

/** Прибрати зі слотів ті, що потрапили в будь-який блок барбера. */
export function excludeBlockedSlots<T extends SlotInterval>(
  slots: T[],
  blocks: TimeBlockData[]
): T[] {
  return slots.filter((slot) => !blocks.some((block) => blocksSlot(block, slot)));
}

/**
 * Перевірка накладання блоків (T-4420): на того самого барбера в тій самій
 * локації не можна покласти два блоки, що перетинаються за часом. Виклик
 * передає лише блоки одного дня — модель блоку зберігає час без дати.
 * Блок, що торкається краю іншого, не вважається накладанням (як `blocksSlot`).
 */
export function hasTimeBlockOverlap(existing: TimeBlockData[], candidate: TimeBlockData): boolean {
  return existing.some(
    (block) =>
      block.id !== candidate.id &&
      block.barberId === candidate.barberId &&
      block.locationId === candidate.locationId &&
      blocksSlot(block, candidate)
  );
}
