import { makeVisit } from '../appointments/fixtures';
import { countPastVisits, formatVisitCount } from './visit-count';

describe('countPastVisits (T-4734)', () => {
  it('рахує лише минулі візити зі списку кабінету', () => {
    const list = [
      makeVisit({ id: 'a', status: 'completed' }),
      makeVisit({ id: 'b', status: 'cancelled' }),
      makeVisit({ id: 'c', status: 'upcoming' }),
      makeVisit({ id: 'd', status: 'confirmed' }),
    ];
    expect(countPastVisits(list)).toBe(2);
  });

  it('порожній список — нуль', () => {
    expect(countPastVisits([])).toBe(0);
  });

  it('рядок показує нуль, а не ховає його', () => {
    expect(formatVisitCount(0)).toBe('Візитів: 0');
  });

  it('рядок показує кількість', () => {
    expect(formatVisitCount(7)).toBe('Візитів: 7');
  });
});
