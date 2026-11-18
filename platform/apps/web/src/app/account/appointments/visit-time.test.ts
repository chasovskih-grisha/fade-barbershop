import { kyivWallTime, kyivWallToUtc, rescheduleSlot, shiftEnd } from './visit-time';

describe('час візиту в Києві', () => {
  it('переводить 15:00 у вересні на 12:00 UTC', () => {
    expect(kyivWallTime('2026-09-28', '15:00')).toBe(Date.parse('2026-09-28T12:00:00.000Z'));
  });

  it('повертає мітки UTC, які чекає API', () => {
    expect(kyivWallToUtc('2026-09-28', '15:00')).toEqual({ date: '2026-09-28', time: '12:00' });
    expect(kyivWallToUtc('2026-01-15', '15:00')).toEqual({ date: '2026-01-15', time: '13:00' });
  });

  it('переносить слот у мітки API, зберігаючи тривалість', () => {
    expect(rescheduleSlot({ startTime: '10:00', endTime: '10:45' }, '2026-10-03', '14:00')).toEqual(
      {
        date: '2026-10-03',
        start: '11:00',
        end: '11:45',
      }
    );
  });

  it('зсуває кінець, зберігаючи тривалість', () => {
    expect(shiftEnd('10:00', '10:45', '14:00')).toBe('14:45');
  });
});
