import { ComposedServiceSlotOptimizer } from './composed-service-slot-optimizer';

describe('ComposedServiceSlotOptimizer', () => {
  it('successfully schedules multi-service appointments consecutively', () => {
    const request = {
      clientId: 'client-1',
      targetDayStartMinute: 600, // 10:00 AM
      services: [
        {
          serviceId: 's1',
          serviceName: 'Classic Fade',
          durationMinutes: 30,
          requiredSpecialty: 'fade',
        },
        {
          serviceId: 's2',
          serviceName: 'Beard Trim',
          durationMinutes: 20,
          requiredSpecialty: 'beard',
        },
      ],
      barbers: [
        {
          barberId: 'barber-1',
          barberName: 'Alex',
          specialties: ['fade', 'beard'],
          availableIntervals: [{ startMinute: 500, endMinute: 800 }],
        },
      ],
    };

    const result = ComposedServiceSlotOptimizer.optimize(request, 5);

    expect(result.success).toBe(true);
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0]?.startMinute).toBe(600);
    expect(result.allocations[0]?.endMinute).toBe(630);
    expect(result.allocations[1]?.startMinute).toBe(635); // 630 + 5 min buffer
    expect(result.allocations[1]?.endMinute).toBe(655);
    expect(result.feasibilityScore).toBe(1.0);
  });

  it('fails when barber availability window is insufficient', () => {
    const request = {
      clientId: 'client-2',
      targetDayStartMinute: 600,
      services: [
        {
          serviceId: 's1',
          serviceName: 'Full Styling',
          durationMinutes: 60,
          requiredSpecialty: 'styling',
        },
      ],
      barbers: [
        {
          barberId: 'barber-1',
          barberName: 'Alex',
          specialties: ['styling'],
          availableIntervals: [{ startMinute: 600, endMinute: 630 }], // only 30 min available
        },
      ],
    };

    const result = ComposedServiceSlotOptimizer.optimize(request, 5);

    expect(result.success).toBe(false);
    expect(result.feasibilityScore).toBe(0);
    expect(result.reason).toBeDefined();
  });
});
