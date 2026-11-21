import { optimizeSmartBufferPacing } from './smart-buffer-pacing-optimizer';

describe('SmartBufferPacingOptimizer', () => {
  it('calculates dynamic buffer minutes and pacing risk correctly', () => {
    const result = optimizeSmartBufferPacing({
      barberId: 'barber-1',
      locationId: 'loc-1',
      date: '2026-11-15',
      appointments: [
        {
          appointmentId: 'apt-1',
          startTime: '10:00',
          endTime: '10:30',
          serviceType: 'Haircut',
          isVip: false,
          clientHistoricalNoShowRate: 0.05,
        },
        {
          appointmentId: 'apt-2',
          startTime: '18:00',
          endTime: '18:45',
          serviceType: 'Fade & Beard',
          isVip: true,
          clientHistoricalNoShowRate: 0.25,
        },
      ],
      peakHours: [{ startHour: 17, endHour: 20 }],
    });

    expect(result.barberId).toBe('barber-1');
    expect(result.totalAppointments).toBe(2);
    expect(result.recommendedBufferMinutes['apt-1']).toBe(5); // default
    expect(result.recommendedBufferMinutes['apt-2']).toBe(18); // 5 base + 3 peak + 5 VIP + 5 no-show
    expect(result.pacingRiskScore).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
