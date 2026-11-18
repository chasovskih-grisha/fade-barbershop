import { evaluateHighRiskClient, calculateCancellationFee, calculateNoShowPenalty, calculateDynamicGracePeriod } from '../policy';
import { CancellationPolicyConfig } from '../types';

describe('Cancellation and No-Show Policy Domain Logic', () => {
  const defaultPolicy: CancellationPolicyConfig = {
    locationId: 'loc-1',
    freeCancelHours: 4,
    depositForHighRisk: true,
    highRiskThreshold: 3,
  };

  test('evaluates high-risk client correctly when threshold reached', () => {
    const record = evaluateHighRiskClient('client-1', 3, 1, defaultPolicy);
    expect(record.isHighRisk).toBe(true);
    expect(record.requiresFullDeposit).toBe(true);
    expect(record.blockOnlineBooking).toBe(true);
    expect(record.isExcused).toBe(false);
  });

  test('waives deposit and unblocks booking for excused no-show / cancellation override', () => {
    const record = evaluateHighRiskClient('client-1', 3, 1, defaultPolicy, false, true);
    expect(record.isHighRisk).toBe(false);
    expect(record.requiresFullDeposit).toBe(false);
    expect(record.blockOnlineBooking).toBe(false);
    expect(record.isExcused).toBe(true);
  });

  test('waives deposit for VIP clients when vipDepositWaiver policy is enabled', () => {
    const vipPolicy: CancellationPolicyConfig = {
      ...defaultPolicy,
      vipDepositWaiver: true,
    };
    const record = evaluateHighRiskClient('client-vip', 3, 0, vipPolicy, true, false);
    expect(record.isHighRisk).toBe(true);
    expect(record.requiresFullDeposit).toBe(false); // VIP waiver active
    expect(record.blockOnlineBooking).toBe(false);
  });

  test('evaluates normal client correctly when threshold not reached', () => {
    const record = evaluateHighRiskClient('client-2', 1, 0, defaultPolicy);
    expect(record.isHighRisk).toBe(false);
    expect(record.requiresFullDeposit).toBe(false);
    expect(record.blockOnlineBooking).toBe(false);
  });

  test('calculates cancellation fee when canceling within free cancel window with deposit credit', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    const slotTime = new Date('2026-11-10T14:00:00Z'); // 2 hours away (< 4 hours)
    const result = calculateCancellationFee(slotTime, now, 1000, 4, 300);

    expect(result.isWithinWindow).toBe(true);
    expect(result.feeAmount).toBe(1000);
    expect(result.depositCredited).toBe(true);
    expect(result.netPayableFee).toBe(700);
    expect(result.hoursUntilSlot).toBe(2);
  });

  test('waives cancellation fee when canceling outside free cancel window', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    const slotTime = new Date('2026-11-10T18:00:00Z'); // 6 hours away (> 4 hours)
    const result = calculateCancellationFee(slotTime, now, 1000, 4, 300);

    expect(result.isWithinWindow).toBe(false);
    expect(result.feeAmount).toBe(0);
    expect(result.netPayableFee).toBe(0);
    expect(result.hoursUntilSlot).toBe(6);
  });

  test('calculates no-show penalty and deposit forfeiture with net fee calculation', () => {
    const penalty1 = calculateNoShowPenalty(1000, 1, false, 300);
    expect(penalty1.depositForfeited).toBe(true);
    expect(penalty1.penaltyFee).toBe(500);
    expect(penalty1.netPenaltyFee).toBe(200);
    expect(penalty1.warningIssued).toBe(true);

    const penalty2 = calculateNoShowPenalty(1000, 2, false, 300);
    expect(penalty2.penaltyFee).toBe(1000);
    expect(penalty2.netPenaltyFee).toBe(700);
    expect(penalty2.warningIssued).toBe(false);

    const vipPenalty = calculateNoShowPenalty(1000, 1, true, 300);
    expect(vipPenalty.penaltyFee).toBe(0);
    expect(vipPenalty.netPenaltyFee).toBe(0);
    expect(vipPenalty.depositForfeited).toBe(false);
  });

  test('calculates dynamic grace period based on completed visits', () => {
    expect(calculateDynamicGracePeriod(4, 5)).toBe(4);
    expect(calculateDynamicGracePeriod(4, 12)).toBe(6);
  });
});
