// Розбивка записів за каналом (T-4536, Done-пункт «аналітика по source»).
// Статистика віддає сирі рядки з БД (там ще живуть історичні 'web'/'admin'),
// групування в канонічні канали — чиста функція, тож перевіряється тестом.
import { normalizeBookingSource } from '../../scheduling/domain/booking-source';

export const BOOKING_SOURCE_STATS = 'BOOKING_SOURCE_STATS';

export interface BookingSourceCount {
  source: string;
  count: number;
}

export interface BookingSourceStats {
  countsBetween(from: Date, to: Date): Promise<BookingSourceCount[]>;
}

/** Зливає аліаси в канонічні канали й сортує за спаданням кількості. */
export function groupByCanonical(rows: readonly BookingSourceCount[]): BookingSourceCount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = normalizeBookingSource(row.source) ?? 'unknown';
    totals.set(key, (totals.get(key) ?? 0) + row.count);
  }
  return [...totals.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

export class GetBookingSourceBreakdown {
  constructor(private readonly stats: BookingSourceStats) {}

  async handle(
    from: Date,
    to: Date
  ): Promise<{ from: string; to: string; sources: BookingSourceCount[] }> {
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from >= to) {
      throw new RangeError('from must be before to');
    }
    const sources = groupByCanonical(await this.stats.countsBetween(from, to));
    return { from: from.toISOString(), to: to.toISOString(), sources };
  }
}
