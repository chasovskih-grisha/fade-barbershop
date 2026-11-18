import {
  activeVisits,
  awaitingConfirmation,
  canStartWalkIn,
  chairOccupancy,
  chairsBusyAt,
  dayTimeline,
  weekAggregate,
  type BarberVisit,
} from './barber-schedule';

function visit(overrides: Partial<BarberVisit> = {}): BarberVisit {
  return {
    id: 'v1',
    date: '2026-09-11',
    startTime: '11:00',
    endTime: '11:45',
    clientName: 'Марія',
    serviceName: 'Гоління',
    status: 'confirmed',
    hasReference: false,
    hasComment: false,
    ...overrides,
  };
}

describe('barber day timeline (T-082)', () => {
  it('sorts active visits by start time and drops finished ones', () => {
    const visits = [
      visit({ id: 'late', startTime: '16:00', endTime: '16:45' }),
      visit({ id: 'done', startTime: '09:00', endTime: '09:30', status: 'completed' }),
      visit({ id: 'early', startTime: '10:00', endTime: '10:30' }),
    ];
    expect(dayTimeline(visits).map((v) => v.id)).toEqual(['early', 'late']);
    expect(activeVisits(visits)).toHaveLength(2);
  });

  it('collects visits waiting for confirmation at the top', () => {
    const visits = [
      visit({ id: 'a', startTime: '16:00', endTime: '16:45', status: 'booked' }),
      visit({ id: 'b', startTime: '11:00', endTime: '11:45' }),
      visit({ id: 'c', startTime: '12:00', endTime: '12:45', status: 'booked' }),
    ];
    expect(awaitingConfirmation(visits).map((v) => v.id)).toEqual(['c', 'a']);
  });
});

describe('barber chair occupancy (T-082)', () => {
  it('counts chairs busy on a half-open interval', () => {
    const visits = [
      visit({ startTime: '11:00', endTime: '11:45' }),
      visit({ id: 'v2', startTime: '11:30', endTime: '12:15' }),
    ];
    expect(chairsBusyAt(visits, '11:30')).toBe(2);
    // 11:45 — кінець першого візиту, тож крісло вже вільне.
    expect(chairsBusyAt(visits, '11:45')).toBe(1);
  });

  it('shows occupancy as chairs used of two and blocks walk-in when full', () => {
    const visits = [
      visit({ startTime: '11:00', endTime: '11:45' }),
      visit({ id: 'v2', startTime: '11:00', endTime: '11:45' }),
    ];
    expect(chairOccupancy(visits, '11:10')).toBe('крісла: 2/2');
    expect(canStartWalkIn(visits, '11:10')).toBe(false);
    expect(canStartWalkIn(visits, '12:00')).toBe(true);
  });

  it('never reports more busy chairs than the two-chair invariant', () => {
    const visits = [1, 2, 3].map((n) =>
      visit({ id: `v${n}`, startTime: '11:00', endTime: '11:45' })
    );
    expect(chairOccupancy(visits, '11:10')).toBe('крісла: 2/2');
  });
});

describe('barber week aggregate (T-082)', () => {
  it('counts active visits per day in date order', () => {
    const visits = [
      visit({ id: 'a', date: '2026-09-12', startTime: '10:00', endTime: '10:30' }),
      visit({ id: 'b', date: '2026-09-11', startTime: '10:00', endTime: '10:30' }),
      visit({ id: 'c', date: '2026-09-11', startTime: '11:00', endTime: '11:30' }),
      visit({ id: 'd', date: '2026-09-11', status: 'cancelled' }),
    ];
    expect(weekAggregate(visits)).toEqual([
      { date: '2026-09-11', count: 2 },
      { date: '2026-09-12', count: 1 },
    ]);
  });
});
