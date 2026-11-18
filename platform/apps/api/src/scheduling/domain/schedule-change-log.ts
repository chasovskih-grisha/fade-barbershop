// Журнал змін графіка барбера (T-230, SCH-006/SCH-007): хто змінив (барбер чи
// адмін), коли, що саме (старе → нове). Барбер бачить власну історію, щоб
// розуміти, хто зробив поточний графік; адмін бачить журнал мережі (SCH-ADM-02).
// Домен без Nest/Prisma.

import type { AvailabilityWindowData, ScheduleChangeSource } from './availability';

export interface ScheduleChange {
  barberId: string;
  locationId: string;
  source: ScheduleChangeSource;
  changedBy: string;
  occurredAt: Date;
  previous: AvailabilityWindowData[];
  next: AvailabilityWindowData[];
}

export function recordScheduleChange(
  change: Omit<ScheduleChange, 'occurredAt'> & { occurredAt?: Date }
): ScheduleChange {
  return { ...change, occurredAt: change.occurredAt ?? new Date() };
}

/** Історія барбера — найновіші зміни першими (SCH-007). */
export function historyForBarber(changes: ScheduleChange[], barberId: string): ScheduleChange[] {
  return changes
    .filter((change) => change.barberId === barberId)
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}

/** Журнал мережі з фільтром по барберу (SCH-ADM-02). */
export function networkScheduleLog(changes: ScheduleChange[], barberId?: string): ScheduleChange[] {
  return barberId ? historyForBarber(changes, barberId) : [...changes];
}
