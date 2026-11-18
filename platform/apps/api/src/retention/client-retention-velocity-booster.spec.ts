import { ClientRetentionVelocityBooster } from './domain/client-retention-velocity-booster.entity';

describe('ClientRetentionVelocityBooster', () => {
  it('should evaluate HEALTHY velocity when visit cadence is on track', () => {
    const result = ClientRetentionVelocityBooster.evaluateVelocity(21, 15);
    expect(result.riskLevel).toBe('HEALTHY');
    expect(result.cadenceRatio).toBe(0.71);
    expect(result.policy.discountPercentage).toBe(0);
  });

  it('should evaluate WARNING velocity and suggest 10% discount when overdue', () => {
    const result = ClientRetentionVelocityBooster.evaluateVelocity(20, 26);
    expect(result.riskLevel).toBe('WARNING');
    expect(result.cadenceRatio).toBe(1.3);
    expect(result.policy.discountPercentage).toBe(10);
    expect(result.outreachMessage).toContain('FADE-VELOCITY-15');
  });

  it('should evaluate HIGH_RISK velocity and suggest 15% discount code FADE-VELOCITY-15', () => {
    const result = ClientRetentionVelocityBooster.evaluateVelocity(20, 32);
    expect(result.riskLevel).toBe('HIGH_RISK');
    expect(result.cadenceRatio).toBe(1.6);
    expect(result.policy.discountPercentage).toBe(15);
    expect(result.outreachMessage).toContain('FADE-VELOCITY-15');
  });

  it('should evaluate CRITICAL velocity and trigger VIP concierge win-back alert', () => {
    const result = ClientRetentionVelocityBooster.evaluateVelocity(20, 45);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.cadenceRatio).toBe(2.25);
    expect(result.policy.discountPercentage).toBe(25);
    expect(result.outreachMessage).toContain('Urgent VIP Alert');
  });
});
