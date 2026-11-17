import { reduceProfiles, reduceWindow } from './client-list-facts.reduce';

const T = (iso: string) => new Date(iso);

const row = (over: Partial<Parameters<typeof reduceProfiles>[0][number]> = {}) => ({
  id: 'p-1',
  userId: 'u-1',
  createdAt: T('2026-01-01T00:00:00.000Z'),
  loyaltyVisitsCount: 0,
  ...over,
});

describe('reduceProfiles grouping (T-4606b)', () => {
  it('кожен профіль читає лише своєї групи — сусідні клієнти не змішуються', () => {
    const facts = reduceProfiles(
      [row({ id: 'p-1', userId: 'u-1' }), row({ id: 'p-2', userId: 'u-2' })],
      [
        {
          clientId: 'p-1',
          locationId: 'loc-1',
          count: 2,
          lastStart: T('2026-10-01T10:00:00.000Z'),
        },
        {
          clientId: 'p-2',
          locationId: 'loc-2',
          count: 1,
          lastStart: T('2026-10-09T10:00:00.000Z'),
        },
      ]
    );
    expect(facts.map((fact) => fact.visits)).toEqual([2, 1]);
  });
});

describe('reduceWindow (T-4606b)', () => {
  it('`revenue: null` (немає сум) стає 0, `status: null` лишається null', () => {
    expect(reduceWindow([{ status: null, count: 3, revenue: null }])).toEqual([
      { status: null, count: 3, revenue: 0 },
    ]);
  });

  it('додатна сума і статус переносяться як є', () => {
    expect(reduceWindow([{ status: 'completed', count: 2, revenue: 900 }])).toEqual([
      { status: 'completed', count: 2, revenue: 900 },
    ]);
  });
});
