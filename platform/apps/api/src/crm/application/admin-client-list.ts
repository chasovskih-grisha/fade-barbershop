// Read-модель списку клієнтів (T-4606a/T-4606b, admin-screens §6.1) — за
// патерном AdminCalendar: тонкий контролер, валідація в
// admin-client-list.query.ts, помилка запиту → 400 через CrmExceptionFilter.
// Відповідь {items,total,page,pages,summary} (16-shared §Pagination; T-4606b).
// Лічильник і останній візит — одним запитом на сторінку (порт visitStats),
// 3/7 — з профілю: без N+1 (Done T-4606a). Зведення (T-4606b) читає факти
// всього фільтра — рівно стільки ж запитів, скільки й сторінка: цифри не
// залежать від пагінації, і `summary.total` — той самий `total`, що й таблиця.
import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENT_LIST_READER,
  type ClientListReader,
  type ClientListWhere,
  type ProfileOrder,
} from './client-list-reader';
import { parseClientListQuery, type ClientListQuery } from './admin-client-list.query';
import {
  compareStat,
  item,
  statFor,
  type ClientListPage,
  type ClientListResult,
} from './admin-client-list.view';
import { buildClientListSummary, summaryWindow } from './client-list-summary';
import type { ClientListFacts } from './client-list-summary';
import type { Clock } from '../domain/ports';
import { profilePage, visitStatsMap } from './admin-client-list.stats';

/** DI-токен годинника для вікна підсумків (application не знає про інфраструктуру). */
export const CLIENT_LIST_CLOCK = Symbol('CLIENT_LIST_CLOCK');

/** Порожні факти: клієнтів за фільтром немає — запитувати агрегати нічого. */
const EMPTY_FACTS: ClientListFacts = { profiles: [], window: [] };

@Injectable()
export class AdminClientList {
  constructor(
    @Inject(CLIENT_LIST_READER) private readonly reader: ClientListReader,
    @Inject(CLIENT_LIST_CLOCK) private readonly clock: Clock
  ) {}

  async handle(raw: Record<string, string | undefined>): Promise<ClientListResult> {
    const q = parseClientListQuery(raw);
    const now = this.clock.now();
    const clientKeys = q.locationId ? await this.reader.locationVisitors(q.locationId) : undefined;
    const where: ClientListWhere = {
      ...(q.search ? { search: q.search } : {}),
      ...(q.loyaltyStatus ? { loyaltyStatus: q.loyaltyStatus } : {}),
      ...(clientKeys ? { clientKeys } : {}),
      phoneSearch: q.phoneSearch,
    };
    // У локації немає відвідувачів — порожня сторінка без подальших запитів.
    const page: ClientListPage =
      clientKeys?.length === 0
        ? { items: [], total: 0, page: q.page, pages: 0 }
        : await this.page({ ...q }, where);
    const facts =
      page.total === 0
        ? EMPTY_FACTS
        : await this.reader.summary(where, summaryWindow(q.period, now));
    return {
      ...page,
      summary: buildClientListSummary({ total: page.total, period: q.period, now, facts }),
    };
  }

  /** Сторінка: колонки профілю — через СУБД, visits/lastVisit — через статистику. */
  private page(q: ClientListQuery, where: ClientListWhere): Promise<ClientListPage> {
    if (q.sort === 'visits' || q.sort === 'lastVisit')
      return this.byVisits({ ...q, sort: q.sort }, where);
    return this.byProfile({ ...q, sort: q.sort }, where);
  }

  private byProfile(
    q: ClientListQuery & { sort: ProfileOrder['key'] },
    where: ClientListWhere
  ): Promise<ClientListPage> {
    return profilePage(this.reader, q, where);
  }

  /** visits/lastVisit: індекс профілів → статистика (один groupBy) → слайс. */
  private async byVisits(
    q: ClientListQuery & { sort: 'visits' | 'lastVisit' },
    where: ClientListWhere
  ): Promise<ClientListPage> {
    const keys = await this.reader.keys(where);
    const stats = await visitStatsMap(
      this.reader,
      keys.flatMap((key) => [key.id, key.userId])
    );
    const value = (key: { id: string; userId: string }) => statFor(stats, key);
    const factor = q.order === 'asc' ? 1 : -1;
    const sorted = [...keys].sort(
      (a, b) => factor * compareStat(value(a), value(b), q.sort) || a.id.localeCompare(b.id)
    );
    const slice = sorted.slice((q.page - 1) * q.perPage, q.page * q.perPage);
    const byId = new Map(
      (await this.reader.byIds(slice.map((key) => key.id))).map((r) => [r.id, r])
    );
    const items = slice.flatMap((key) => {
      const row = byId.get(key.id);
      return row ? [item(row, value(key))] : [];
    });
    const total = keys.length;
    return { items, total, page: q.page, pages: Math.ceil(total / q.perPage) };
  }
}
