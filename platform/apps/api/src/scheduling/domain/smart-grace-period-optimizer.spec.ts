import { optimizeSmartGracePeriod } from './smart-grace-period-optimizer';

describe('SmartGracePeriodOptimizer', () => {
  it('should calculate standard grace period for normal client under normal load', () => {
    const result = optimizeSmartGracePeriod({
      barberId: 'barber-1',
      locationId: 'loc-1',
      appointmentId: 'apt-1',
      scheduledStartTime: '10:00',
      scheduledEndTime: '10:45',
      serviceDurationMinutes: 45,
      clientNoShowRate: 0.10,
      clientVipStatus: false,
      currentStudioQueueLoadPercentage: 50,
    });

    expect(result.recommendedGraceMinutes).toBe(10);
    expect(result.autoExtensionAllowed).toBe(true);
  });

  it('should give bonuses for VIP and reliable clients', () => {
    const result = optimizeSmartGracePeriod({
      barberId: 'barber-1',
      locationId: 'loc-1',
      appointmentId: 'apt-2',
      scheduledStartTime: '11:00',
      scheduledEndTime: '11:45',
      serviceDurationMinutes: 45,
      clientNoShowRate: 0.02, // very reliable
      clientVipStatus: true,
      currentStudioQueueLoadPercentage: 60,
    });

    // base 10 + VIP 5 + reliable 3 = 18
    expect(result.recommendedGraceMinutes).toBe(18);
    expect(result.autoExtensionAllowed).toBe(true);
  });

  it('should restrict grace period and disable auto-extension for non-VIP under high congestion', () => {
    const result = optimizeSmartGracePeriod({
      barberId: 'barber-1',
      locationId: 'loc-1',
      appointmentId: 'apt-3',
      scheduledStartTime: '17:00',
      scheduledEndTime: '17:45',
      serviceDurationMinutes: 45,
      clientNoShowRate: 0.15,
      clientVipStatus: false,
      currentStudioQueueLoadPercentage: 90, // high congestion
    });

    expect(result.recommendedGraceMinutes).toBe(6); // 10 - 4
    expect(result.autoExtensionAllowed).toBe(false);
  });
});
