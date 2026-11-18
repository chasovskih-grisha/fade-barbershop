import { pickNextVisit, formatVisitWhen, formatVisitWhere, waitingForDeposit } from './next-visit';
import type { ExtendedAppointment } from '@/lib/api/appointments';

function visit(over: Partial<ExtendedAppointment> = {}): ExtendedAppointment {
  return {
    id: 'v1',
    date: '2026-12-04',
    startTime: '14:00',
    endTime: '15:00',
    serviceName: 'Стрижка',
    barberName: 'Олександр',
    locationName: 'Центр',
    price: 600,
    status: 'confirmed',
    referenceId: null,
    referenceComment: '',
    canEditReference: true,
    deposit: null,
    ...over,
  };
}

describe('pickNextVisit (T-4716b)', () => {
  it('бере найближчий майбутній візит, ігноруючи минулі', () => {
    const next = pickNextVisit([
      visit({ id: 'late', date: '2026-12-20' }),
      visit({ id: 'past', date: '2026-11-01', status: 'completed' }),
      visit({ id: 'soon', date: '2026-12-05' }),
    ]);
    expect(next?.id).toBe('soon');
  });

  it('враховує час, коли дати збігаються', () => {
    const next = pickNextVisit([
      visit({ id: 'evening', date: '2026-12-04', startTime: '18:00' }),
      visit({ id: 'morning', date: '2026-12-04', startTime: '09:00' }),
    ]);
    expect(next?.id).toBe('morning');
  });

  it('повертає null, коли майбутніх немає', () => {
    expect(pickNextVisit([visit({ status: 'cancelled' })])).toBeNull();
    expect(pickNextVisit([])).toBeNull();
  });
});

describe('formatting the card lines (T-4716b)', () => {
  it('рядок 1 — день, дата і час початку–кінця', () => {
    const when = formatVisitWhen(
      visit({ date: '2026-12-04', startTime: '14:00', endTime: '15:00' })
    );
    expect(when).toContain('14:00–15:00');
    expect(when).toMatch(/п.ятниц/); // день тижня uk-UA; апостроф залежить від ICU
    expect(when).toContain('4 грудня');
  });

  it('рядок 2 — послуга, барбер, локація', () => {
    expect(formatVisitWhere(visit())).toBe('Стрижка • Олександр • Центр');
  });

  it('невідомий формат дати показує як є', () => {
    expect(formatVisitWhen(visit({ date: '10 листопада' }))).toContain('10 листопада');
  });
});

describe('waitingForDeposit (T-4716b)', () => {
  it('попереджає, коли візит очікує депозит', () => {
    expect(waitingForDeposit(visit({ deposit: { amount: 200, freeCancelUntil: null } }))).toBe(
      true
    );
  });

  it('не попереджає без депозиту', () => {
    expect(waitingForDeposit(visit({ deposit: null }))).toBe(false);
    expect(waitingForDeposit(visit({ deposit: { amount: 0, freeCancelUntil: null } }))).toBe(false);
  });
});
