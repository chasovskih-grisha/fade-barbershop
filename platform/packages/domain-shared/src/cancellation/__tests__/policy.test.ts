import { evaluateHighRiskClient } from '../policy';
import { CancellationPolicyConfig } from '../types';

describe('Cancellation high-risk client policy', () => {
  const defaultPolicy: CancellationPolicyConfig = {
    locationId: 'loc-1',
    freeCancelHours: 4,
    depositForHighRisk: true,
    highRiskThreshold: 3,
  };

  test('evaluates high-risk client correctly when threshold reached', () => {
    const record = evaluateHighRiskClient({
      clientId: 'client-1',
      noShowCount90d: 3,
      cancellationCount90d: 1,
      policy: defaultPolicy,
    });
    expect(record.isHighRisk).toBe(true);
    expect(record.requiresFullDeposit).toBe(true);
    expect(record.blockOnlineBooking).toBe(true);
    expect(record.isExcused).toBe(false);
  });

  test('waives deposit and unblocks booking for excused no-show / cancellation override', () => {
    const record = evaluateHighRiskClient({
      clientId: 'client-1',
      noShowCount90d: 3,
      cancellationCount90d: 1,
      policy: defaultPolicy,
      isExcused: true,
    });
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
    const record = evaluateHighRiskClient({
      clientId: 'client-vip',
      noShowCount90d: 3,
      cancellationCount90d: 0,
      policy: vipPolicy,
      isVip: true,
    });
    expect(record.isHighRisk).toBe(true);
    expect(record.requiresFullDeposit).toBe(false);
    expect(record.blockOnlineBooking).toBe(false);
  });

  test('evaluates normal client correctly when threshold not reached', () => {
    const record = evaluateHighRiskClient({
      clientId: 'client-2',
      noShowCount90d: 1,
      cancellationCount90d: 0,
      policy: defaultPolicy,
    });
    expect(record.isHighRisk).toBe(false);
    expect(record.requiresFullDeposit).toBe(false);
    expect(record.blockOnlineBooking).toBe(false);
  });
});
