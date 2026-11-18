// Доступність композиції послуг (T-4520b): тривалість слоту — сума тривалостей
// позицій (послідовно) або максимум (паралельно, кілька барберів). Композиція не
// «загортається» через обід чи кінець дня: слот доступний, лише якщо вся сума
// вміщується в один безперервний проміжок робочого дня. Чистий домен.

export interface ServicePosition {
  serviceId: string;
  durationMinutes: number;
}

/** Послідовно — сума; паралельно (кілька барберів) — максимум. */
export type CompositionMode = 'sequential' | 'parallel';

export interface MinuteInterval {
  startMinute: number;
  endMinute: number;
}

/** Тривалість композиції для обраного режиму. Порожня композиція — 0. */
export function compositionDuration(
  positions: readonly ServicePosition[],
  mode: CompositionMode
): number {
  if (positions.length === 0) return 0;
  const durations = positions.map((position) => position.durationMinutes);
  return mode === 'parallel'
    ? Math.max(...durations)
    : durations.reduce((total, duration) => total + duration, 0);
}

/** Слот уміщується в один безперервний проміжок — не «загортається» на стику. */
export function fitsInOneInterval(
  slotStartMinute: number,
  durationMinutes: number,
  intervals: readonly MinuteInterval[]
): boolean {
  const slotEnd = slotStartMinute + durationMinutes;
  return intervals.some(
    (interval) => interval.startMinute <= slotStartMinute && slotEnd <= interval.endMinute
  );
}

/** Початки, з яких композиція вміщується в проміжок робочого дня. */
export function compositionStarts(
  candidates: readonly number[],
  durationMinutes: number,
  intervals: readonly MinuteInterval[]
): number[] {
  return candidates.filter((start) => fitsInOneInterval(start, durationMinutes, intervals));
}
