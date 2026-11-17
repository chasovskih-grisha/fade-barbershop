import type { ClientListQuery } from './admin-client-list.query';
import { item, statFor, type ClientListPage } from './admin-client-list.view';
import type {
  ClientListReader,
  ClientListWhere,
  ProfileOrder,
  VisitStatRow,
} from './client-list-reader';

/** Один запит статистики на сторінку/сортування — без N+1. */
export async function visitStatsMap(
  reader: ClientListReader,
  clientIds: string[]
): Promise<Map<string, VisitStatRow>> {
  if (clientIds.length === 0) return new Map();
  const rows = await reader.visitStats([...new Set(clientIds)]);
  return new Map(rows.map((row) => [row.clientId, row]));
}

/** Сортування по колонках профілю — порядок визначає СУБД (skip/take). */
export async function profilePage(
  reader: ClientListReader,
  q: ClientListQuery & { sort: ProfileOrder['key'] },
  where: ClientListWhere
): Promise<ClientListPage> {
  const total = await reader.count(where);
  const rows = await reader.page(
    where,
    { key: q.sort, dir: q.order },
    { limit: q.perPage, offset: (q.page - 1) * q.perPage }
  );
  const stats = await visitStatsMap(
    reader,
    rows.flatMap((row) => [row.id, row.userId])
  );
  return {
    items: rows.map((row) => item(row, statFor(stats, row))),
    total,
    page: q.page,
    pages: Math.ceil(total / q.perPage),
  };
}
