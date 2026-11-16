import { AnalyticsTracker, ConversionFunnelAnalyzer } from '../src/index';

describe('Analytics & Conversion Intelligence', () => {
  it('tracks events correctly', () => {
    const tracker = AnalyticsTracker.getInstance();
    tracker.track('booking_started', { serviceId: '123' }, 'user_1');
    const queue = tracker.getQueue();
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[queue.length - 1].eventName).toBe('booking_started');
  });

  it('calculates conversion funnels correctly', () => {
    const steps = [
      { stepName: 'View Landing', users: 1000 },
      { stepName: 'Select Service', users: 500 },
      { stepName: 'Pick Time', users: 250 },
      { stepName: 'Complete Booking', users: 100 },
    ];
    const result = ConversionFunnelAnalyzer.calculateFunnel(steps);
    expect(result.length).toBe(4);
    expect(result[0].conversionRate).toBe(100);
    expect(result[3].conversionRate).toBe(10);
    expect(result[3].dropoffRate).toBe(60); // 250 -> 100 is 60% dropoff from previous step (or calculate step conversion)
  });
});
