import { optimizeSmartBufferPacing } from './smart-buffer-pacing-optimizer';

describe('SmartBufferPacingOptimizer Advanced Suite', () => {
  it('handles empty appointments list gracefully', () => {
    const result = optimizeSmartBufferPacing({
      barberId: 'barber-empty',
      locationId: 'loc-1',
      date: '2026-11-15',
      appointments: [],
      peakHours: [{ startHour: 17, endHour: 20 }],
    });

    expect(result.totalAppointments).toBe(0);
    expect(result.pacingRiskScore).toBe(0);
    expect(result.recommendedBufferMinutes).toEqual({});
    expect(result.recommendations[0]).toContain('optimal');
  });

  it('applies maximum risk cap correctly under high cascade stress', () => {
    const result = optimizeSmartBufferPacing({
      barberId: 'barber-stress',
      locationId: 'loc-1',
      date: '2026-11-15',
      appointments: [
        {
          appointmentId: 'stress-1',
          startTime: '18:30',
          endTime: '19:15',
          serviceType: 'Full Styling',
          isVip: true,
          clientHistoricalNoShowRate: 0.50,
        },
      ],
      peakHours: [{ startHour: 17, endHour: 21 }],
    });

    expect(result.recommendedBufferMinutes['stress-1']).toBe(18); // 5 + 3 + 5 + 5
    expect(result.pacingRiskScore).toBeLessThanOrEqual(100);
    expect(result.recommendations[0]).toContain('High schedule congestion');
  });
});
