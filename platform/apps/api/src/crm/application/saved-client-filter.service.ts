/* eslint-disable max-lines -- cohesive module (142 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4461: збережені CRM-фільтри — застосунковий шар.
// Правила (валідація, канонічний запит, підпис, квота) — у
// domain/saved-client-filter.ts; тут порт сховища й повторне виконання запиту
// через наявну read-модель AdminClientList (той самий контракт, що й
// GET /admin/clients).
//
// Сховище in-memory: у `prisma/schema.prisma` немає таблиці збережених
// фільтрів. Порт `SavedClientFilterRepository` готовий прийняти Prisma-адаптер
// без зміни use-case.
import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { AdminClientList, CLIENT_LIST_CLOCK } from './admin-client-list';
import type { ClientListResult } from './admin-client-list.view';
import type { Clock } from '../domain/ports';
import { SavedFilterNotFoundError } from './crm-errors';
import {
  assertFilterCanBeSaved,
  createSavedFilter,
  filterListItems,
  isOwnedBy,
  renameSavedFilter,
  savedFilterLabel,
  toListParams,
  updateSavedFilterQuery,
  type SavedClientFilter,
} from '../domain/saved-client-filter';

export const SAVED_CLIENT_FILTER_REPOSITORY = Symbol('SAVED_CLIENT_FILTER_REPOSITORY');

export interface SavedClientFilterRepository {
  findById(id: string): Promise<SavedClientFilter | null>;
  listByOwner(ownerId: string): Promise<SavedClientFilter[]>;
  save(filter: SavedClientFilter): Promise<void>;
  delete(id: string): Promise<void>;
}

export class InMemorySavedClientFilterRepository implements SavedClientFilterRepository {
  private readonly filters = new Map<string, SavedClientFilter>();

  async findById(id: string): Promise<SavedClientFilter | null> {
    return this.filters.get(id) ?? null;
  }

  async listByOwner(ownerId: string): Promise<SavedClientFilter[]> {
    return [...this.filters.values()].filter((filter) => filter.ownerId === ownerId);
  }

  async save(filter: SavedClientFilter): Promise<void> {
    this.filters.set(filter.id, filter);
  }

  async delete(id: string): Promise<void> {
    this.filters.delete(id);
  }
}

export interface SavedFilterRunResult {
  filter: { id: string; name: string; label: string };
  /** Момент читання: дані щоразу свіжі, у фільтрі зберігається лише запит. */
  readAt: Date;
  page: number;
  result: ClientListResult;
}

@Injectable()
export class SavedClientFilterService {
  constructor(
    @Inject(SAVED_CLIENT_FILTER_REPOSITORY)
    private readonly repository: SavedClientFilterRepository,
    private readonly clientList: AdminClientList,
    @Inject(CLIENT_LIST_CLOCK) private readonly clock: Clock
  ) {}

  /** «Зберегти як»: назва + поточний набір фільтрів списку. */
  async create(input: {
    ownerId: string;
    name: string;
    query: Record<string, string | undefined>;
  }): Promise<SavedClientFilter> {
    const at = this.clock.now();
    const draft = createSavedFilter({
      id: uuidv7(),
      ownerId: input.ownerId,
      name: input.name,
      query: input.query,
      at,
    });
    assertFilterCanBeSaved(await this.repository.listByOwner(input.ownerId), {
      ownerId: input.ownerId,
      name: draft.name,
    });
    await this.repository.save(draft);
    return draft;
  }

  /** Список власника: найновіші спершу, з підписом запиту. */
  async list(ownerId: string): Promise<ReturnType<typeof filterListItems>> {
    return filterListItems(await this.repository.listByOwner(ownerId));
  }

  async get(id: string, ownerId: string): Promise<SavedClientFilter> {
    return this.require(id, ownerId);
  }

  async rename(id: string, ownerId: string, name: string): Promise<SavedClientFilter> {
    const filter = await this.require(id, ownerId);
    const renamed = renameSavedFilter(filter, name, this.clock.now());
    assertFilterCanBeSaved(await this.repository.listByOwner(ownerId), {
      ownerId,
      name: renamed.name,
      ignoreId: id,
    });
    await this.repository.save(renamed);
    return renamed;
  }

  /** Оновлення запиту збереженого фільтра (те саме «зберегти як»). */
  async updateQuery(
    id: string,
    ownerId: string,
    query: Record<string, string | undefined>
  ): Promise<SavedClientFilter> {
    const filter = await this.require(id, ownerId);
    const updated = updateSavedFilterQuery(filter, query, this.clock.now());
    await this.repository.save(updated);
    return updated;
  }

  async remove(id: string, ownerId: string): Promise<{ id: string; deleted: true }> {
    await this.require(id, ownerId);
    await this.repository.delete(id);
    return { id, deleted: true };
  }

  /** Повторне виконання однією дією: свіже читання з тим самим запитом. */
  async run(
    id: string,
    ownerId: string,
    input: { page?: number } = {}
  ): Promise<SavedFilterRunResult> {
    const filter = await this.require(id, ownerId);
    const page = input.page ?? 1;
    const result = await this.clientList.handle(toListParams(filter.query, page));
    return {
      filter: { id: filter.id, name: filter.name, label: savedFilterLabel(filter.query) },
      readAt: this.clock.now(),
      page,
      result,
    };
  }

  /** Dry-run preview: повертає label, count та першу сторінку для перевірки до збереження. */
  async preview(
    ownerId: string,
    name: string,
    query: Record<string, string | undefined>
  ): Promise<{ label: string; count: number; page: number }> {
    const draft = createSavedFilter({ id: uuidv7(), ownerId, name, query });
    const existing = await this.repository.listByOwner(ownerId);
    const assertInput = { ownerId, name };
    assertFilterCanBeSaved(existing, assertInput);
    const pageResult = await this.clientList.handle(toListParams(draft.query, 1));
    return {
      label: savedFilterLabel(draft.query),
      count: existing.length,
      page: pageResult.page,
    };
  }

  private async require(id: string, ownerId: string): Promise<SavedClientFilter> {
    const filter = await this.repository.findById(id);
    if (!filter || !isOwnedBy(filter, ownerId)) throw new SavedFilterNotFoundError(id);
    return filter;
  }
}
