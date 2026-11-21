/* eslint-disable max-lines -- cohesive module (245 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4461: збережені CRM-фільтри — канонічний запит, CRUD,
// квота/дублі, ізоляція власника й повторне виконання через список клієнтів.
import type { AdminClientList } from './admin-client-list';
import type { ClientListResult } from './admin-client-list.view';
import {
  InvalidClientListQueryError,
  SavedFilterConflictError,
  SavedFilterNotFoundError,
} from './crm-errors';
import {
  MAX_SAVED_FILTERS_PER_OWNER,
  SAVED_FILTER_NAME_MAX_LENGTH,
  assertFilterCanBeSaved,
  createSavedFilter,
  filterListItems,
  isCanonicalQuery,
  normalizeSavedFilterQuery,
  renameSavedFilter,
  savedFilterLabel,
  toListParams,
  updateSavedFilterQuery,
  validateFilterName,
} from '../domain/saved-client-filter';
import {
  InMemorySavedClientFilterRepository,
  SavedClientFilterService,
} from './saved-client-filter.service';
import { AdminClientFiltersController } from '../infrastructure/admin-client-filters.controller';

const NOW = new Date('2026-11-19T12:00:00Z');
const EMPTY_RESULT = {
  items: [],
  total: 0,
  page: 1,
  pages: 0,
  summary: {},
} as unknown as ClientListResult;

function harness() {
  const calls: Array<Record<string, string | undefined>> = [];
  const clientList = {
    handle: async (raw: Record<string, string | undefined>) => {
      calls.push(raw);
      return EMPTY_RESULT;
    },
  } as unknown as AdminClientList;
  const repository = new InMemorySavedClientFilterRepository();
  const clock = { now: () => NOW };
  return {
    calls,
    repository,
    service: new SavedClientFilterService(repository, clientList, clock),
  };
}

describe('saved client filter policy (T-4461)', () => {
  it('normalises the query to the list contract and stores no page', () => {
    const query = normalizeSavedFilterQuery({
      search: '  Олена ',
      locationId: 'loc-1',
      loyaltyStatus: 'active',
      sort: 'lastVisit',
      order: 'desc',
      perPage: '50',
      period: '90d',
    });

    expect(query).toEqual({
      search: 'Олена',
      locationId: 'loc-1',
      loyaltyStatus: 'active',
      sort: 'lastVisit',
      order: 'desc',
      perPage: 50,
      period: '90d',
    });
    expect(isCanonicalQuery(query)).toBe(true);

    expect(() => normalizeSavedFilterQuery({ page: '2' })).toThrow(InvalidClientListQueryError);
    expect(() => normalizeSavedFilterQuery({ sort: 'birthday' })).toThrow(
      InvalidClientListQueryError
    );
    expect(() => normalizeSavedFilterQuery({ perPage: '500' })).toThrow(
      InvalidClientListQueryError
    );
  });

  it('builds a Ukrainian label and query params for re-running', () => {
    const query = normalizeSavedFilterQuery({
      search: 'Олена',
      loyaltyStatus: 'inactive',
      period: '7d',
    });

    expect(savedFilterLabel(query)).toBe('пошук: Олена · неактивні · 7 днів');
    expect(savedFilterLabel(normalizeSavedFilterQuery({}))).toBe('30 днів');

    expect(toListParams(query, 3)).toMatchObject({
      search: 'Олена',
      loyaltyStatus: 'inactive',
      period: '7d',
      page: '3',
      perPage: '20',
    });
    expect(toListParams(query).page).toBe('1');
    expect(() => toListParams(query, 0)).toThrow('page must be');
  });

  it('validates the name and creates/renames/updates a filter', () => {
    expect(validateFilterName('   ')).toEqual(['Filter name is required']);
    expect(validateFilterName('а'.repeat(SAVED_FILTER_NAME_MAX_LENGTH + 1))).toHaveLength(1);

    const created = createSavedFilter({
      id: 'f-1',
      ownerId: 'admin-1',
      name: '  Тихі 60 днів  ',
      query: { loyaltyStatus: 'inactive' },
      at: NOW,
    });
    expect(created.name).toBe('Тихі 60 днів');
    expect(created.createdAt).toEqual(NOW);

    const renamed = renameSavedFilter(created, 'Тихі клієнти', new Date(NOW.getTime() + 1000));
    expect(renamed.name).toBe('Тихі клієнти');
    expect(renamed.query).toEqual(created.query);

    const updated = updateSavedFilterQuery(renamed, { period: '90d' });
    expect(updated.query.period).toBe('90d');
    expect(updated.name).toBe('Тихі клієнти');
  });

  it('rejects duplicate names and the per-owner quota', () => {
    const existing = Array.from({ length: MAX_SAVED_FILTERS_PER_OWNER }, (_, index) =>
      createSavedFilter({
        id: `f-${index}`,
        ownerId: 'admin-1',
        name: `Фільтр ${index}`,
        query: {},
        at: NOW,
      })
    );

    expect(() =>
      assertFilterCanBeSaved(existing, { ownerId: 'admin-1', name: 'фільтр 0' })
    ).toThrow(SavedFilterConflictError);
    expect(() => assertFilterCanBeSaved(existing, { ownerId: 'admin-1', name: 'Новий' })).toThrow(
      `limit reached (${MAX_SAVED_FILTERS_PER_OWNER}`
    );
    expect(() =>
      assertFilterCanBeSaved(existing, { ownerId: 'admin-2', name: 'Новий' })
    ).not.toThrow();

    expect(filterListItems(existing)).toHaveLength(MAX_SAVED_FILTERS_PER_OWNER);
    expect(filterListItems(existing)[0]?.label).toBe('30 днів');
  });
});

describe('SavedClientFilterService (T-4461)', () => {
  it('saves a filter, lists it for the owner and isolates other owners', async () => {
    const { service } = harness();

    const created = await service.create({
      ownerId: 'admin-1',
      name: 'Не були 60 днів, локація А',
      query: { locationId: 'loc-a', loyaltyStatus: 'inactive', period: '90d' },
    });

    const list = await service.list('admin-1');
    expect(list).toEqual([
      expect.objectContaining({
        id: created.id,
        name: 'Не були 60 днів, локація А',
        label: 'loc-a · неактивні · 90 днів',
      }),
    ]);
    expect(await service.list('admin-2')).toEqual([]);

    await expect(service.get(created.id, 'admin-2')).rejects.toThrow(SavedFilterNotFoundError);
    expect((await service.get(created.id, 'admin-1')).query.locationId).toBe('loc-a');
  });

  it('rejects a duplicate name and the quota', async () => {
    const { service } = harness();
    await service.create({ ownerId: 'admin-1', name: 'Мій фільтр', query: {} });

    await expect(
      service.create({ ownerId: 'admin-1', name: '  мій фільтр ', query: {} })
    ).rejects.toThrow(SavedFilterConflictError);

    const { service: second } = harness();
    for (let index = 0; index < MAX_SAVED_FILTERS_PER_OWNER; index += 1) {
      await second.create({ ownerId: 'admin-1', name: `Фільтр ${index}`, query: {} });
    }
    await expect(second.create({ ownerId: 'admin-1', name: 'Ще один', query: {} })).rejects.toThrow(
      'limit reached'
    );
  });

  it('renames, updates the query and deletes', async () => {
    const { service } = harness();
    const created = await service.create({ ownerId: 'admin-1', name: 'Стара назва', query: {} });

    const renamed = await service.rename(created.id, 'admin-1', 'Нова назва');
    expect(renamed.name).toBe('Нова назва');

    const updated = await service.updateQuery(created.id, 'admin-1', {
      search: 'Ігор',
      sort: 'visits',
      order: 'desc',
    });
    expect(updated.query).toMatchObject({ search: 'Ігор', sort: 'visits', order: 'desc' });

    expect(await service.remove(created.id, 'admin-1')).toEqual({
      id: created.id,
      deleted: true,
    });
    await expect(service.get(created.id, 'admin-1')).rejects.toThrow(SavedFilterNotFoundError);
  });

  it('re-runs the stored query with a fresh read and pagination override', async () => {
    const { calls, service } = harness();
    const created = await service.create({
      ownerId: 'admin-1',
      name: 'Активні',
      query: { loyaltyStatus: 'active', period: '7d', perPage: '50' },
    });

    const run = await service.run(created.id, 'admin-1', { page: 2 });

    expect(calls).toEqual([
      {
        search: undefined,
        locationId: undefined,
        loyaltyStatus: 'active',
        sort: 'name',
        order: 'asc',
        perPage: '50',
        period: '7d',
        page: '2',
      },
    ]);
    expect(run.readAt).toEqual(NOW);
    expect(run.filter).toEqual({ id: created.id, name: 'Активні', label: 'активні · 7 днів' });
    expect(run.page).toBe(2);
  });

  it('refuses to run an unknown filter and validates stored queries on save', async () => {
    const { service } = harness();

    await expect(service.run('missing', 'admin-1')).rejects.toThrow(SavedFilterNotFoundError);
    await expect(
      service.create({ ownerId: 'admin-1', name: 'Зламаний', query: { perPage: '0' } })
    ).rejects.toThrow(InvalidClientListQueryError);
    expect(await service.list('admin-1')).toEqual([]);
  });
});

describe('AdminClientFiltersController (T-4461)', () => {
  it('exposes CRUD and one-click run on the saved filter', async () => {
    const { service } = harness();
    const api = new AdminClientFiltersController(service);

    const created = await api.create({
      ownerId: 'admin-1',
      name: 'Тихі',
      query: { loyaltyStatus: 'inactive' },
    });
    expect(created.query.loyaltyStatus).toBe('inactive');

    const list = await api.list('admin-1');
    expect(list.total).toBe(1);

    expect((await api.get(created.id, 'admin-1')).name).toBe('Тихі');
    expect((await api.rename(created.id, { ownerId: 'admin-1', name: 'Дуже тихі' })).name).toBe(
      'Дуже тихі'
    );

    const run = await api.run(created.id, { ownerId: 'admin-1' });
    expect(run.filter.name).toBe('Дуже тихі');
    expect(run.result.total).toBe(0);

    expect(await api.remove(created.id, 'admin-1')).toEqual({ id: created.id, deleted: true });
  });
});
