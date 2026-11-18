// Фікстури відповіді GET /admin/clients (T-4606a/T-4606b): одна форма
// {items,total,page,pages,summary} для сторінкових спек — щоб тест станів
// читався як сценарій, а не як складання DTO. Рядки — з ClientsTable.fixtures.
import type { ClientListResult, ClientListSummary } from './client-list-types';
import { bookable, maria } from './ClientsTable.fixtures';

/** Зведення на двох клієнтів: цифри навмисно різні — видно підстановку полів. */
export const summaryFixture: ClientListSummary = {
  total: 2,
  period: '30d',
  from: '2026-09-10T00:00:00.000Z',
  to: '2026-10-10T00:00:00.000Z',
  newClients: 1,
  visits: 5,
  revenue: 4500,
  avgTicket: 900,
  noShowRate: 0.2,
  quietClients: 1,
  quietShare: 0.5,
  repeatShare: 0.5,
  loyalty: { none: 1, progress: 1, freeVisit: 0, cycle: 0 },
  locations: { byLocation: [{ locationId: 'loc-1', count: 1 }], noVisit: 1 },
};

/** Сторінка списку; `summary.total` — той самий `total`, що й у таблиці. */
export function clientListResult(over: Partial<ClientListResult> = {}): ClientListResult {
  return {
    items: [bookable, maria],
    total: 2,
    page: 1,
    pages: 1,
    summary: summaryFixture,
    ...over,
  };
}

/** Порожній фільтр: зведення з нулями (сервер не робить агрегатних запитів). */
export function emptyClientList(over: Partial<ClientListSummary> = {}): ClientListResult {
  return clientListResult({
    items: [],
    total: 0,
    pages: 0,
    summary: {
      ...summaryFixture,
      total: 0,
      newClients: 0,
      visits: 0,
      revenue: 0,
      avgTicket: 0,
      noShowRate: 0,
      quietClients: 0,
      quietShare: 0,
      repeatShare: 0,
      loyalty: { none: 0, progress: 0, freeVisit: 0, cycle: 0 },
      locations: { byLocation: [], noVisit: 0 },
      ...over,
    },
  });
}
