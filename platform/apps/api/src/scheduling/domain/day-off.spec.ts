import { createDayOff, InvalidDayOffError, isDayOff, windowsForDate } from './day-off';

const windows = [
  { dayOfWeek: 0, start: '09:00', end: '17:00' },
  { dayOfWeek: 1, start: '09:00', end: '17:00' },
];

describe('createDayOff (SCH-002)', () => {
  it('accepts a valid single day and a valid range', () => {
    expect(
      createDayOff({
        id: 'd1',
        barberId: 'b1',
        from: '2026-09-28',
        to: '2026-09-28',
        reason: 'day off',
      })
    ).toMatchObject({ from: '2026-09-28' });
    expect(
      createDayOff({
        id: 'd2',
        barberId: 'b1',
        from: '2026-09-28',
        to: '2026-10-02',
        reason: 'vacation',
      })
    ).toMatchObject({ to: '2026-10-02' });
  });

  it('rejects a bad date, a reversed range and a missing reason', () => {
    expect(() =>
      createDayOff({ id: 'd', barberId: 'b', from: '2026-13-40', to: '2026-13-41', reason: 'x' })
    ).toThrow(InvalidDayOffError);
    expect(() =>
      createDayOff({ id: 'd', barberId: 'b', from: '2026-10-02', to: '2026-09-28', reason: 'x' })
    ).toThrow(InvalidDayOffError);
    expect(() =>
      createDayOff({ id: 'd', barberId: 'b', from: '2026-09-28', to: '2026-09-28', reason: ' ' })
    ).toThrow(InvalidDayOffError);
  });
});

describe('isDayOff / windowsForDate', () => {
  const dayOffs = [
    createDayOff({ id: 'd', barberId: 'b1', from: '2026-09-28', to: '2026-09-29', reason: 'sick' }),
  ];

  it('covers both range bounds', () => {
    expect(isDayOff(dayOffs, '2026-09-28')).toBe(true);
    expect(isDayOff(dayOffs, '2026-09-29')).toBe(true);
    expect(isDayOff(dayOffs, '2026-09-30')).toBe(false);
  });

  it('removes the weekday windows on a day off and keeps them otherwise', () => {
    expect(windowsForDate(windows, dayOffs, '2026-09-28')).toEqual([]);
    expect(windowsForDate(windows, dayOffs, '2026-10-05')).toEqual([windows[0]]);
  });
});
