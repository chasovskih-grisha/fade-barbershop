import {
  calculateCancellationFee,
  calculateNoShowPenalty,
  calculateDynamicGracePeriod,
} from '../fees';

describe('Cancellation fees and no-show penalties', () => {
  test('calculates cancellation fee within free cancel window with deposit credit', () => {
    const result = calculateCancellationFee({
      slotTime: new Date('2026-11-10T14:00:00Z'),
      now: new Date('2026-11-10T12:00:00Z'),
      servicePrice: 1000,
      freeCancelHours: 4,
      depositAmountPaid: 300,
    });

    expect(result.isWithinWindow).toBe(true);
    expect(result.feeAmount).toBe(1000);
    expect(result.depositCredited).toBe(true);
    expect(result.netPayableFee).toBe(700);
    expect(result.hoursUntilSlot).toBe(2);
  });

  test('waives cancellation fee outside free cancel window', () => {
    const result = calculateCancellationFee({
      slotTime: new Date('2026-11-10T18:00:00Z'),
      now: new Date('2026-11-10T12:00:00Z'),
      servicePrice: 1000,
      freeCancelHours: 4,
      depositAmountPaid: 300,
    });

    expect(result.isWithinWindow).toBe(false);
    expect(result.feeAmount).toBe(0);
    expect(result.netPayableFee).toBe(0);
    expect(result.hoursUntilSlot).toBe(6);
  });

  test('calculates no-show penalty and deposit forfeiture with net fee calculation', () => {
    const penalty1 = calculateNoShowPenalty({
      servicePrice: 1000,
      consecutiveNoShows: 1,
      depositAmountPaid: 300,
    });
    expect(penalty1.depositForfeited).toBe(true);
    expect(penalty1.penaltyFee).toBe(500);
    expect(penalty1.netPenaltyFee).toBe(200);
    expect(penalty1.warningIssued).toBe(true);

    const penalty2 = calculateNoShowPenalty({
      servicePrice: 1000,
      consecutiveNoShows: 2,
      depositAmountPaid: 300,
    });
    expect(penalty2.penaltyFee).toBe(1000);
    expect(penalty2.netPenaltyFee).toBe(700);
    expect(penalty2.warningIssued).toBe(false);

    const vipPenalty = calculateNoShowPenalty({
      servicePrice: 1000,
      consecutiveNoShows: 1,
      isVip: true,
      depositAmountPaid: 300,
    });
    expect(vipPenalty.penaltyFee).toBe(0);
    expect(vipPenalty.netPenaltyFee).toBe(0);
    expect(vipPenalty.depositForfeited).toBe(false);
  });

  test('calculates dynamic grace period based on completed visits', () => {
    expect(calculateDynamicGracePeriod(4, 5)).toBe(4);
    expect(calculateDynamicGracePeriod(4, 12)).toBe(6);
  });
});
