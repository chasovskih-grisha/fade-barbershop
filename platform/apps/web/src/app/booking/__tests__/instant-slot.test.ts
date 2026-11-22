import { parseTimeToMinutes, pickInstantSlot } from '../instant-slot';
import type { AvailableSlotDto } from '../types';

const slots: AvailableSlotDto[] = [
  { start: '14:00', end: '15:00', barbers: [] },
  { start: '11:00', end: '12:00', barbers: ['barber-1'] },
  { start: '09:30', end: '10:00', barbers: ['barber-2'] },
];

describe('instant slot selection (T-5027)', () => {
  it('parses clock times strictly', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570);
    expect(parseTimeToMinutes('23:59')).toBe(1_439);
    expect(parseTimeToMinutes('24:00')).toBeNull();
    expect(parseTimeToMinutes('9:5')).toBeNull();
    expect(parseTimeToMinutes('noon')).toBeNull();
  });

  it('picks the earliest free slot on a future date', () => {
    expect(pickInstantSlot(slots, '2026-12-01', new Date('2026-11-22T20:00:00'))).toEqual({
      start: '09:30',
      end: '10:00',
      barbers: ['barber-2'],
    });
  });

  it('skips past and busy slots for today', () => {
    expect(pickInstantSlot(slots, '2026-11-22', new Date('2026-11-22T10:45:00'))).toEqual({
      start: '11:00',
      end: '12:00',
      barbers: ['barber-1'],
    });
    expect(pickInstantSlot(slots, '2026-11-22', new Date('2026-11-22T13:00:00'))).toBeNull();
  });

  it('returns null when nothing is bookable', () => {
    expect(pickInstantSlot([], '2026-11-22')).toBeNull();
    expect(
      pickInstantSlot([{ start: '12:00', end: '13:00', barbers: [] }], '2026-12-01')
    ).toBeNull();
    expect(
      pickInstantSlot([{ start: 'bad', end: 'worse', barbers: ['b'] }], '2026-12-01')
    ).toBeNull();
  });
});
