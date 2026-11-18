// План партицій (T-4804): чисті функції — які місячні партиції мають існувати
// наперед і який DDL їх створює. Сам DDL виконує ops-крок (таблиця
// переписується на партиційовану), тому тут не потрібна БД: план
// перевіряється тестом, а SQL вставляється в runbook/міграцію.

export interface PartitionRange {
  /** Ім'я партиції, напр. booking_2026_12. */
  name: string;
  /** Початок діапазону (включно), UTC. */
  from: Date;
  /** Кінець діапазону (не включно), UTC. */
  to: Date;
}

function monthStart(anchor: Date): Date {
  return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
}

function partitionName(table: string, month: Date): string {
  const mm = String(month.getUTCMonth() + 1).padStart(2, '0');
  return `${table}_${month.getUTCFullYear()}_${mm}`;
}

/**
 * Партиції на `monthsAhead` місяців уперед, починаючи з місяця anchor.
 * Ідемпотентність забезпечує `IF NOT EXISTS` у DDL, тож повторний прогін
 * безпечний.
 */
export function monthlyPartitions(anchor: Date, monthsAhead: number): PartitionRange[] {
  if (!Number.isInteger(monthsAhead) || monthsAhead <= 0) {
    throw new RangeError('monthsAhead must be a positive integer');
  }
  const first = monthStart(anchor);
  const out: PartitionRange[] = [];
  for (let index = 0; index < monthsAhead; index += 1) {
    const from = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + index, 1));
    const to = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + index + 1, 1));
    out.push({ name: partitionName('booking', from), from, to });
  }
  return out;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** DDL для партиції; `parent` — партиційована таблиця (booking). */
export function partitionDdl(parent: string, range: PartitionRange): string {
  return (
    `CREATE TABLE IF NOT EXISTS "${range.name}" PARTITION OF "${parent}" ` +
    `FOR VALUES FROM ('${isoDay(range.from)}') TO ('${isoDay(range.to)}');`
  );
}
