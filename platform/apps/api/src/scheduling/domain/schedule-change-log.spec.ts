import { historyForBarber, networkScheduleLog, recordScheduleChange } from './schedule-change-log';

const base = {
  locationId: 'loc-1',
  source: 'barber' as const,
  changedBy: 'barber-1',
  previous: [],
  next: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }],
};

describe('recordScheduleChange (SCH-006/007)', () => {
  it('stamps the occurrence time when none is given', () => {
    const change = recordScheduleChange({ ...base, barberId: 'barber-1' });
    expect(change.occurredAt).toBeInstanceOf(Date);
    expect(change.source).toBe('barber');
  });

  it('keeps the barber history newest first and filters the network log', () => {
    const older = recordScheduleChange({
      ...base,
      barberId: 'barber-1',
      occurredAt: new Date('2026-09-28T09:00:00Z'),
    });
    const newer = recordScheduleChange({
      ...base,
      barberId: 'barber-1',
      source: 'admin',
      changedBy: 'admin-1',
      occurredAt: new Date('2026-09-29T09:00:00Z'),
    });
    const other = recordScheduleChange({
      ...base,
      barberId: 'barber-2',
      occurredAt: new Date('2026-09-30T09:00:00Z'),
    });

    expect(historyForBarber([older, newer, other], 'barber-1')).toEqual([newer, older]);
    expect(networkScheduleLog([older, newer, other])).toHaveLength(3);
    expect(networkScheduleLog([older, newer, other], 'barber-2')).toEqual([other]);
  });
});
