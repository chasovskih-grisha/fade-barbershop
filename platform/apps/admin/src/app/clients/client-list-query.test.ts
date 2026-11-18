// Query-стан списку клієнтів (T-4606a/T-4606b): URL — єдине джерело правди.
// Тести тримають три інваріанти: дефолти не потрапляють в URL (посилання
// коротке), невідомий period/page не ламає сторінку (дефолт, не 400 — 400
// віддає лише API), period у URL лишається, коли не дефолтний.
import {
  DEFAULT_PERIOD,
  SUMMARY_PERIODS,
  applyParams,
  clientListQuery,
  readClientListState,
} from './client-list-query';

const params = (query = '') => new URLSearchParams(query);

describe('readClientListState', () => {
  it('без параметрів — дефолти: ім’я asc, сторінка 1, період 30d', () => {
    expect(readClientListState(params())).toEqual({
      search: '',
      locationId: '',
      loyaltyStatus: '',
      sort: { key: 'name', dir: 'asc' },
      page: 1,
      period: DEFAULT_PERIOD,
    });
  });

  it('читає фільтри, сортування, сторінку й період з URL', () => {
    const state = readClientListState(
      params(
        'search=ivan&locationId=loc-1&loyaltyStatus=active&sort=visits&order=desc&page=3&period=90d'
      )
    );
    expect(state).toEqual({
      search: 'ivan',
      locationId: 'loc-1',
      loyaltyStatus: 'active',
      sort: { key: 'visits', dir: 'desc' },
      page: 3,
      period: '90d',
    });
  });

  it('order відрізняється від asc лише як desc — решта напрямів це asc', () => {
    expect(readClientListState(params('order=desc')).sort.dir).toBe('desc');
    expect(readClientListState(params('order=sideways')).sort.dir).toBe('asc');
  });

  it('невалідний period/page не ламає список: дефолт замість помилки', () => {
    expect(readClientListState(params('period=1y')).period).toBe(DEFAULT_PERIOD);
    expect(readClientListState(params('page=abc')).page).toBe(1);
    expect(readClientListState(params('page=0')).page).toBe(1);
    expect(readClientListState(params('page=2.7')).page).toBe(2);
  });

  it('закритий набір періодів — рівно контракт API (T-4606 §6.1)', () => {
    expect(SUMMARY_PERIODS).toEqual(['7d', '30d', '90d']);
  });
});

describe('applyParams', () => {
  it('оновлює наявні параметри і додає нові', () => {
    expect(applyParams('search=ivan&page=3', { page: '2', sort: 'visits' })).toBe(
      'search=ivan&page=2&sort=visits'
    );
  });

  it('порожнє значення прибирає параметр з URL', () => {
    expect(applyParams('page=3&sort=visits', { page: '', sort: 'name' })).toBe('sort=name');
    expect(applyParams('', { page: '' })).toBe('');
  });
});

describe('clientListQuery', () => {
  it('дефолтний стан не пише в URL жодного параметра', () => {
    expect(clientListQuery(params('period=30d&page=1&sort=name&order=asc'))).toBe('');
  });

  it('усі непорожні параметри — у фіксованому порядку (стабільні посилання)', () => {
    expect(
      clientListQuery(
        params(
          'search=ivan&locationId=loc-1&loyaltyStatus=active&sort=visits&order=desc&page=3&period=90d'
        )
      )
    ).toBe(
      'search=ivan&locationId=loc-1&loyaltyStatus=active&sort=visits&order=desc&page=3&period=90d'
    );
  });

  it('period живе в URL лише коли не дефолтний — посиланням можна поділитись', () => {
    expect(clientListQuery(params('period=7d'))).toBe('period=7d');
    expect(clientListQuery(params(''))).toBe('');
  });
});
