// Ядро календаря барбера (T-082, barber-screens.md §2): день і тиждень.
// Чисті функції без React/Expo — екран лише малює результат. Дані — лише
// власні візити барбера (межі доступу — шапка barber-screens.md).

export type BarberVisitStatus =
  'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

/** Візит у календарі барбера: час, клієнт, послуга, статус, референс/коментар. */
export interface BarberVisit {
  id: string;
  /** Дата `YYYY-MM-DD`; час `HH:MM` — як у решті застосунку. */
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  serviceName: string;
  status: BarberVisitStatus;
  hasReference: boolean;
  hasComment: boolean;
}

/** Інваріант двох крісел локації (фаза 4): зайнятих місць не більше двох. */
export const CHAIR_CAPACITY = 2;

/** Статуси, що займають крісло; завершені/скасовані/неявки — ні. */
const ACTIVE_STATUSES: BarberVisitStatus[] = ['booked', 'confirmed', 'in_progress'];

function minutes(time: string): number {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/** Візити, що займають крісло (крім завершених, скасованих і неявок). */
export function activeVisits(visits: BarberVisit[]): BarberVisit[] {
  return visits.filter((v) => ACTIVE_STATUSES.includes(v.status));
}

/** Таймлайн дня: активні візити за зростанням часу початку. */
export function dayTimeline(visits: BarberVisit[]): BarberVisit[] {
  return [...activeVisits(visits)].sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
}

/** Блок «Очікують підтвердження»: візити в статусі `booked` (barber-screens §2). */
export function awaitingConfirmation(visits: BarberVisit[]): BarberVisit[] {
  return dayTimeline(visits.filter((v) => v.status === 'booked'));
}

/** Скільки крісел зайнято в момент `HH:MM` (напіввідкритий інтервал). */
export function chairsBusyAt(visits: BarberVisit[], at: string): number {
  const now = minutes(at);
  return activeVisits(visits).filter((v) => minutes(v.startTime) <= now && now < minutes(v.endTime))
    .length;
}

/** Показник зайнятості для заголовка календаря: «крісла: X/2 зайнято». */
export function chairOccupancy(visits: BarberVisit[], at: string): string {
  const busy = Math.min(chairsBusyAt(visits, at), CHAIR_CAPACITY);
  return `крісла: ${busy}/${CHAIR_CAPACITY}`;
}

/** FAB «Walk-in» вимкнено, коли обидва крісла зайняті (WALK-BAR-01). */
export function canStartWalkIn(visits: BarberVisit[], at: string): boolean {
  return chairsBusyAt(visits, at) < CHAIR_CAPACITY;
}

/** Тижневий агрегат: кількість активних візитів за кожен день (barber-screens §3). */
export function weekAggregate(visits: BarberVisit[]): { date: string; count: number }[] {
  const byDate = new Map<string, number>();
  for (const visit of activeVisits(visits)) {
    byDate.set(visit.date, (byDate.get(visit.date) ?? 0) + 1);
  }
  return [...byDate.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
