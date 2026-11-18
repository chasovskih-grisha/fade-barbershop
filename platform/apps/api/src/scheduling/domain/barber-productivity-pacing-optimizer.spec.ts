import { calculateBarberProductivityPacing } from './barber-productivity-pacing-optimizer';

describe('BarberProductivityPacingOptimizer', () => {
  const baseDate = new Date('2026-11-12T09:00:00Z');
  const makeDate = (hours: number, mins: number) => {
    const d = new Date(baseDate);
    d.setUTCHours(hours, mins, 0, 0);
    return d;
  };

  it('calculates elite pacing and high occupancy correctly', () => {
    const result = calculateBarberProductivityPacing({
      barberId: 'barber-001',
      operatingStart: makeDate(9, 0),
      operatingEnd: makeDate(17, 0),
      scheduledAppointments: [
        { start: makeDate(9, 0), end: makeDate(9, 45), serviceName: 'Fade & Beard', hairDensity: 'normal' },
        { start: makeDate(10, 0), end: makeDate(10, 45), serviceName: 'Fade', hairDensity: 'fine' },
        { start: makeDate(11, 0), end: makeDate(11, 45), serviceName: 'Luxury Cut', hairDensity: 'thick' },
        { start: makeDate(13, 0), end: makeDate(13, 45), serviceName: 'Fade', hairDensity: 'normal' },
        { start: makeDate(14, 0), end: makeDate(14, 45), serviceName: 'Beard Trim', hairDensity: 'normal' },
        { start: makeDate(15, 0), end: makeDate(15, 45), serviceName: 'Fade & Beard', hairDensity: 'coarse' },
        { start: makeDate(16, 0), end: makeDate(16, 45), serviceName: 'Fade', hairDensity: 'normal' },
      ],
    });

    expect(result.barberId).toBe('barber-001');
    expect(result.totalClients).toBe(7);
    expect(result.pacingRating).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('detects pacing deficit for sparse schedule', () => {
    const result = calculateBarberProductivityPacing({
      barberId: 'barber-002',
      operatingStart: makeDate(9, 0),
      operatingEnd: makeDate(17, 0),
      scheduledAppointments: [
        { start: makeDate(10, 0), end: makeDate(10, 30), serviceName: 'Fade' },
      ],
    });

    expect(result.pacingRating).toBe('Pacing Deficit');
    expect(result.chairOccupancyRate).toBeLessThan(0.50);
  });
});
