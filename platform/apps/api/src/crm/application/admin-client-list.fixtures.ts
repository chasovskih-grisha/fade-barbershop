// Фікстури спеків read-моделі списку клієнтів: профіль, факти зведення, мок
// порту й збірка моделі — окремий файл (гейт max-lines, ADR 0019), щоб спеки
// T-4606a і T-4606b читали один набір «зараз» і один фейк порту.
import { AdminClientList } from './admin-client-list';
import type { ClientListProfileRow, ClientListReader, VisitStatRow } from './client-list-reader';
import type { ClientListFacts } from './client-list-summary';

export const NOW = new Date('2026-10-10T00:00:00.000Z');
export const DAY_MS = 24 * 60 * 60 * 1000;
export const CLOCK = { now: () => NOW };

/** Рядок профілю таблиці §6.1 з дефолтами: `u-<id>`, старий, без візитів. */
export const profile = (
  id: string,
  overrides: Partial<ClientListProfileRow> = {}
): ClientListProfileRow => ({
  id,
  userId: `u-${id}`,
  name: `Клієнт ${id}`,
  phone: '+380671111111',
  vipDiscountPercent: null,
  loyaltyVisitsCount: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

/** Факти зведення за замовчуванням: фільтр без клієнтів. */
export const facts = (over: Partial<ClientListFacts> = {}): ClientListFacts => ({
  profiles: over.profiles ?? [],
  window: over.window ?? [],
});

/** Порт-фейк: фіксує where/order/range і кількість викликів (без N+1). */
export function setup(
  options: {
    rows?: ClientListProfileRow[];
    all?: ClientListProfileRow[];
    stats?: VisitStatRow[];
    keys?: { id: string; userId: string }[];
    facts?: ClientListFacts;
  } = {}
) {
  const rows = options.rows ?? [];
  const all = options.all ?? rows;
  const stats = options.stats ?? [];
  const reader: jest.Mocked<ClientListReader> = {
    count: jest.fn().mockResolvedValue(all.length),
    page: jest.fn().mockResolvedValue(rows),
    keys: jest
      .fn()
      .mockResolvedValue(options.keys ?? all.map((r) => ({ id: r.id, userId: r.userId }))),
    byIds: jest
      .fn()
      .mockImplementation(async (ids: string[]) => all.filter((r) => ids.includes(r.id))),
    visitStats: jest.fn().mockResolvedValue(stats),
    locationVisitors: jest.fn().mockResolvedValue([]),
    summary: jest.fn().mockResolvedValue(options.facts ?? facts()),
  };
  return { list: new AdminClientList(reader, CLOCK), reader };
}
