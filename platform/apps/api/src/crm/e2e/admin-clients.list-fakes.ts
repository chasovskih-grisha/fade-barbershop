// Фейк порту ClientListReader для e2e (T-4606a/T-4606b): ті самі семантики, що
// в Prisma-адаптері (пошук, фільтри, сортування, агрегат візитів, факти
// зведення) — на масивах у пам'яті. Предикати — admin-clients.list-match.fakes,
// сід — admin-clients.list-seed.fakes (гейти max-lines/complexity, ADR 0019).
import type {
  ClientListProfileRow,
  ClientListReader,
  ClientListWhere,
  ProfileOrder,
  VisitStatRow,
} from '../application/client-list-reader';
import type { ClientListFacts, SummaryWindow } from '../application/client-list-summary';
import { compareRows, matches, type MemBooking } from './admin-clients.list-match.fakes';
import { seededBookings, seededRows } from './admin-clients.list-seed.fakes';

export class MemClientList implements ClientListReader {
  rows: ClientListProfileRow[] = [];
  bookings: MemBooking[] = [];

  private match(where: ClientListWhere): ClientListProfileRow[] {
    return this.rows.filter((row) => matches(row, where));
  }

  async count(where: ClientListWhere): Promise<number> {
    return this.match(where).length;
  }

  async page(
    where: ClientListWhere,
    order: ProfileOrder,
    range: { limit: number; offset: number }
  ): Promise<ClientListProfileRow[]> {
    const sorted = [...this.match(where)].sort((a, b) => compareRows(a, b, order));
    return sorted.slice(range.offset, range.offset + range.limit);
  }

  async keys(where: ClientListWhere): Promise<{ id: string; userId: string }[]> {
    return this.match(where).map((row) => ({ id: row.id, userId: row.userId }));
  }

  async byIds(ids: string[]): Promise<ClientListProfileRow[]> {
    return this.rows.filter((row) => ids.includes(row.id));
  }

  async visitStats(clientIds: string[]): Promise<VisitStatRow[]> {
    const stats = new Map<string, VisitStatRow>();
    for (const booking of this.bookings) {
      if (!booking.clientId || !clientIds.includes(booking.clientId)) continue;
      const current = stats.get(booking.clientId) ?? {
        clientId: booking.clientId,
        visits: 0,
        lastVisit: null,
      };
      current.visits += 1;
      if (!current.lastVisit || booking.start > current.lastVisit)
        current.lastVisit = booking.start;
      stats.set(booking.clientId, current);
    }
    return [...stats.values()];
  }

  async locationVisitors(locationId: string): Promise<string[]> {
    const ids = this.bookings
      .filter((booking) => booking.locationId === locationId && booking.clientId)
      .map((booking) => booking.clientId as string);
    return [...new Set(ids)];
  }

  /** Факти зведення (T-4606b): вікно по `start`, виручка — лише завершені. */
  async summary(where: ClientListWhere, window: SummaryWindow): Promise<ClientListFacts> {
    const rows = this.match(where);
    const keys = new Set(rows.flatMap((row) => [row.id, row.userId]));
    const inWindow = this.bookings.filter(
      (booking) =>
        booking.clientId &&
        keys.has(booking.clientId) &&
        booking.start >= window.from &&
        booking.start <= window.to
    );
    const statuses = [...new Set(inWindow.map((booking) => booking.status ?? null))];
    return {
      profiles: rows.map((row) => ({ ...this.profileFacts(row), createdAt: row.createdAt })),
      window: statuses.map((status) => {
        const group = inWindow.filter((booking) => (booking.status ?? null) === status);
        return {
          status,
          count: group.length,
          revenue: group.reduce((sum, booking) => sum + (booking.agreedPrice ?? 0), 0),
        };
      }),
    };
  }

  /** Візити профілю: ключ — `id`, якщо під ним нічого немає — `userId` (як statFor). */
  private profileFacts(row: ClientListProfileRow) {
    const byId = this.bookings.filter((booking) => booking.clientId === row.id);
    const mine = byId.length > 0 ? byId : this.bookings.filter((b) => b.clientId === row.userId);
    const last = mine.reduce<MemBooking | null>(
      (acc, booking) => (!acc || booking.start > acc.start ? booking : acc),
      null
    );
    return {
      loyaltyVisits: row.loyaltyVisitsCount,
      visits: mine.length,
      lastVisitAt: last?.start ?? null,
      lastVisitLocation: last?.locationId ?? null,
    };
  }
}

/** Сід: три клієнти й візити (окремий файл — гейт max-lines). */
export function seededClientList(): MemClientList {
  const list = new MemClientList();
  list.rows = seededRows();
  list.bookings = seededBookings();
  return list;
}
