import { optimizeBarberBreaks } from './barber-break-optimizer';

describe('BarberBreakOptimizer', () => {
  const shiftStart = new Date('2026-11-15T09:00:00.000Z');
  const shiftEnd = new Date('2026-11-15T17:00:00.000Z');

  it('detects low fatigue and zero recommended breaks for well-spaced appointments', () => {
    const appointments = [
      { id: '1', start: new Date('2026-11-15T09:00:00.000Z'), end: new Date('2026-11-15T09:30:00.000Z') },
      { id: '2', start: new Date('2026-11-15T10:00:00.000Z'), end: new Date('2026-11-15T10:45:00.000Z') },
      { id: '3', start: new Date('2026-11-15T11:30:00.000Z'), end: new Date('2026-11-15T12:00:00.000Z') },
    ];

    const result = optimizeBarberBreaks({
      barberId: 'barber-1',
      shiftStart,
      shiftEnd,
      appointments,
    });

    expect(result.barberId).toEqual('barber-1');
    expect(result.burnoutRisk).toEqual('low');
    expect(result.recommendedBreaks.length).toEqual(0);
  });

  it('recommends recovery breaks when back-to-back appointments exceed continuous thresholds', () => {
    const appointments = [
      { id: '1', start: new Date('2026-11-15T09:00:00.000Z'), end: new Date('2026-11-15T09:50:00.000Z') },
      { id: '2', start: new Date('2026-11-15T09:50:00.000Z'), end: new Date('2026-11-15T10:40:00.000Z') },
      { id: '3', start: new Date('2026-11-15T10:40:00.000Z'), end: new Date('2026-11-15T11:30:00.000Z') },
      { id: '4', start: new Date('2026-11-15T11:30:00.000Z'), end: new Date('2026-11-15T12:20:00.000Z') },
    ];

    const result = optimizeBarberBreaks({
      barberId: 'barber-2',
      shiftStart,
      shiftEnd,
      appointments,
      maxContinuousMinutesWithoutBreak: 150,
    });

    expect(result.barberId).toEqual('barber-2');
    expect(result.recommendedBreaks.length).toBeGreaterThan(0);
    expect(result.burnoutRisk).not.toEqual('low');
  });
});
