// Port read-моделі списку клієнтів (T-4606a): профілі + агрегати візитів.
// Окремий файл від AdminClientList — гейт max-lines (ADR 0019); реалізація —
// prisma-client-list.reader.ts, фейк для e2e — у admin-clients.fakes.ts.
import type { ClientSortKey, SortDir, LoyaltyStatus } from './admin-client-list.query';
import type { ClientListFacts, SummaryWindow } from './client-list-summary';

/** DI-токен порту: застосунок залежить від інтерфейсу, не від Prisma. */
export const CLIENT_LIST_READER = Symbol('CLIENT_LIST_READER');

/** Рядок профілю, який потрібен таблиці §6.1 і зведенню (T-4606b). */
export interface ClientListProfileRow {
  id: string;
  userId: string;
  name: string | null;
  phone: string;
  vipDiscountPercent: number | null;
  loyaltyVisitsCount: number;
  /** Реєстрація профілю — вікно «нових» і відлік «тихих» без візитів. */
  createdAt: Date;
}

/** Фільтри списку (нормалізовані parseClientListQuery). */
export interface ClientListWhere {
  /** Підрядок імені (без врахування регістру). */
  search?: string;
  /** Нормалізований телефон (E.164 або цифри фрагмента); null — не номер. */
  phoneSearch?: string | null;
  loyaltyStatus?: LoyaltyStatus;
  /**
   * Дозволені профілі: значення Booking.clientId (User.id або ClientProfile.id
   * — див. phone-booking-path). Порожній масив → жодного рядка.
   */
  clientKeys?: string[];
}

/** Сортування по колонках профілю; visits/lastVisit йдуть шляхом keys+stats. */
export interface ProfileOrder {
  key: Exclude<ClientSortKey, 'visits' | 'lastVisit'>;
  dir: SortDir;
}

/** Агрегат візитів клієнта: лічильник і останній візит (один groupBy). */
export interface VisitStatRow {
  clientId: string;
  visits: number;
  lastVisit: Date | null;
}

/** Читальний порт: обмежена кількість запитів на сторінку, без N+1. */
export interface ClientListReader {
  count(where: ClientListWhere): Promise<number>;
  page(
    where: ClientListWhere,
    order: ProfileOrder,
    range: { limit: number; offset: number }
  ): Promise<ClientListProfileRow[]>;
  /** Усі відповідні профілі (id/userId) — для сортування за visits/lastVisit. */
  keys(where: ClientListWhere): Promise<{ id: string; userId: string }[]>;
  byIds(ids: string[]): Promise<ClientListProfileRow[]>;
  visitStats(clientIds: string[]): Promise<VisitStatRow[]>;
  /** Різні Booking.clientId у локації — члени фільтра locationId. */
  locationVisitors(locationId: string): Promise<string[]>;
  /**
   * Факти фільтрованої множини для стрічки підсумків (T-4606b): профілі зі
   * статистикою візитів за всі часи + візити у вікні за статусом. Пагінація
   * тут не діє — цифри відповідають усьому фільтру, не сторінці; кількість
   * запитів фіксована (без N+1).
   */
  summary(where: ClientListWhere, window: SummaryWindow): Promise<ClientListFacts>;
}
