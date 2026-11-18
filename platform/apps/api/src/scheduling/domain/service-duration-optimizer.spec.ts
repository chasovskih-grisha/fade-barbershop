import { ServiceDurationOptimizationEngine } from './service-duration-optimizer';

describe('ServiceDurationOptimizationEngine', () => {
  const engine = new ServiceDurationOptimizationEngine();

  test('computes standard service duration and buffer without modifiers', () => {
    const result = engine.optimizeDuration({
      baseServiceDurationMinutes: 45,
      baseBufferMinutes: 10,
    });

    expect(result.optimizedServiceDurationMinutes).toBe(45);
    expect(result.optimizedBufferMinutes).toBe(10);
    expect(result.totalSlotDurationMinutes).toBe(55);
    expect(result.consultationBufferAddedMinutes).toBe(0);
  });

  test('adjusts duration for fast barber and fine hair', () => {
    const result = engine.optimizeDuration({
      baseServiceDurationMinutes: 45,
      baseBufferMinutes: 10,
      barberPacingFactor: 0.90, // fast barber
      hairDensity: 'fine',
    });

    // 45 * 0.90 * 0.90 = 36.45 -> rounds to 35 mins
    expect(result.optimizedServiceDurationMinutes).toBe(35);
    expect(result.pacingMultiplier).toBe(0.90);
    expect(result.densityMultiplier).toBe(0.90);
  });

  test('adjusts duration for meticulous barber, coarse hair, and first-time visit consultation', () => {
    const result = engine.optimizeDuration({
      baseServiceDurationMinutes: 45,
      baseBufferMinutes: 10,
      barberPacingFactor: 1.10, // meticulous barber
      hairDensity: 'coarse',
      isFirstVisit: true,
    });

    // 45 * 1.10 * 1.25 = 61.875 -> rounds to 60 mins
    expect(result.optimizedServiceDurationMinutes).toBe(60);
    expect(result.consultationBufferAddedMinutes).toBe(5);
    expect(result.totalSlotDurationMinutes).toBeGreaterThan(65);
  });
});
