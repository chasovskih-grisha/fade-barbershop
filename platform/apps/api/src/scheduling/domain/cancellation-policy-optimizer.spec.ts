import { optimizeCancellationPolicy } from './cancellation-policy-optimizer';

describe('CancellationPolicyOptimizer', () => {
  it('should grant 100% refund and flexible tier for advance cancellation with low risk', () => {
    const result = optimizeCancellationPolicy({
      hoursBeforeAppointment: 30,
      clientHistoricalNoShowRate: 0.0,
      isPeakSurgeSlot: false,
      servicePrice: 1000,
    });

    expect(result.policyTier).toBe('FLEXIBLE');
    expect(result.refundPercentage).toBe(100);
    expect(result.feeAmount).toBe(0);
    expect(result.waitlistPriorityBonus).toBe(true);
    expect(result.riskScore).toBeLessThan(0.3);
  });

  it('should apply non-refundable tier and zero refund for very late cancellation', () => {
    const result = optimizeCancellationPolicy({
      hoursBeforeAppointment: 1,
      clientHistoricalNoShowRate: 0.2,
      isPeakSurgeSlot: true,
      servicePrice: 1200,
    });

    expect(result.policyTier).toBe('NON_REFUNDABLE');
    expect(result.refundPercentage).toBe(0);
    expect(result.feeAmount).toBe(1200);
  });

  it('should apply strict tier and partial refund for short notice cancellation', () => {
    const result = optimizeCancellationPolicy({
      hoursBeforeAppointment: 4,
      clientHistoricalNoShowRate: 0.1,
      isPeakSurgeSlot: true,
      servicePrice: 1200,
    });

    expect(result.policyTier).toBe('STRICT');
    expect(result.refundPercentage).toBe(50);
    expect(result.feeAmount).toBe(600);
  });

  it('should handle moderate notice cancellations correctly', () => {
    const result = optimizeCancellationPolicy({
      hoursBeforeAppointment: 12,
      clientHistoricalNoShowRate: 0.0,
      isPeakSurgeSlot: false,
      servicePrice: 800,
    });

    expect(result.policyTier).toBe('MODERATE');
    expect(result.refundPercentage).toBe(75);
    expect(result.feeAmount).toBe(200);
  });

  it('should apply first-time client leniency and express credit opt-in', () => {
    const result = optimizeCancellationPolicy({
      hoursBeforeAppointment: 1,
      clientHistoricalNoShowRate: 0.0,
      isPeakSurgeSlot: false,
      servicePrice: 1000,
      isFirstTimeClient: true,
      expressCreditOptIn: true,
    });

    expect(result.policyTier).toBe('STRICT');
    expect(result.refundPercentage).toBe(40);
    expect(result.feeAmount).toBe(600);
    expect(result.reason).toContain('First-time client onboarding leniency applied');
  });
});
