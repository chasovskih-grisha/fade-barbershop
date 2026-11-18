import { optimizeChairSanitationPacing } from './chair-sanitation-pacing-optimizer';

describe('ChairSanitationPacingOptimizer', () => {
  it('reports optimal sanitation pacing when gaps exceed required turnover times', () => {
    const appointments = [
      { id: 'app-1', serviceType: 'fade' as const, clientHairDensity: 'thick' as const, start: new Date('2026-11-15T09:00:00.000Z'), end: new Date('2026-11-15T09:45:00.000Z') },
      { id: 'app-2', serviceType: 'beard' as const, clientHairDensity: 'normal' as const, start: new Date('2026-11-15T10:00:00.000Z'), end: new Date('2026-11-15T10:30:00.000Z') },
      { id: 'app-3', serviceType: 'full_service' as const, clientHairDensity: 'coarse' as const, start: new Date('2026-11-15T11:00:00.000Z'), end: new Date('2026-11-15T12:00:00.000Z') },
    ];

    const result = optimizeChairSanitationPacing({
      barberId: 'barber-alpha',
      appointments,
      baseSanitationMinutes: 5,
    });

    expect(result.barberId).toEqual('barber-alpha');
    expect(result.totalAppointments).toEqual(3);
    expect(result.sanitationComplianceRate).toEqual(1.0);
    expect(result.bottlenecks.length).toEqual(0);
    expect(result.status).toEqual('optimal');
  });

  it('detects sanitation bottlenecks and high congestion when back-to-back appointments leave insufficient gaps', () => {
    const appointments = [
      { id: 'app-1', serviceType: 'full_service' as const, clientHairDensity: 'coarse' as const, start: new Date('2026-11-15T09:00:00.000Z'), end: new Date('2026-11-15T10:00:00.000Z') },
      { id: 'app-2', serviceType: 'fade' as const, clientHairDensity: 'thick' as const, start: new Date('2026-11-15T10:00:00.000Z'), end: new Date('2026-11-15T10:45:00.000Z') },
      { id: 'app-3', serviceType: 'full_service' as const, clientHairDensity: 'normal' as const, start: new Date('2026-11-15T10:48:00.000Z'), end: new Date('2026-11-15T11:45:00.000Z') },
    ];

    const result = optimizeChairSanitationPacing({
      barberId: 'barber-beta',
      appointments,
      baseSanitationMinutes: 8,
    });

    expect(result.barberId).toEqual('barber-beta');
    expect(result.bottlenecks.length).toBeGreaterThan(0);
    expect(result.sanitationComplianceRate).toBeLessThan(1.0);
    expect(result.status).not.toEqual('optimal');
  });
});
