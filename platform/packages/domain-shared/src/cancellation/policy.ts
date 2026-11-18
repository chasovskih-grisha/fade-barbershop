import { ClientNoShowRecord, CancellationPolicyConfig } from './types';

export function evaluateHighRiskClient(
  clientId: string,
  noShowCount90d: number,
  cancellationCount90d: number,
  policy: CancellationPolicyConfig,
  isVip: boolean = false,
  isExcused: boolean = false
): ClientNoShowRecord {
  if (isExcused) {
    return {
      clientId,
      noShowCount90d,
      cancellationCount90d,
      isHighRisk: false,
      requiresFullDeposit: false,
      blockOnlineBooking: false,
      isExcused: true,
    };
  }

  const isHighRisk = noShowCount90d >= policy.highRiskThreshold;
  const requiresFullDeposit = isHighRisk && policy.depositForHighRisk && !(policy.vipDepositWaiver && isVip);
  const blockOnlineBooking = isHighRisk && policy.depositForHighRisk && !(policy.vipDepositWaiver && isVip);

  return {
    clientId,
    noShowCount90d,
    cancellationCount90d,
    isHighRisk,
    requiresFullDeposit,
    blockOnlineBooking,
    isExcused: false,
  };
}

export function calculateCancellationFee(
  slotTime: Date,
  now: Date,
  servicePrice: number,
  freeCancelHours: number,
  depositAmountPaid: number = 0
): { feeAmount: number; netPayableFee: number; depositCredited: boolean; isWithinWindow: boolean; hoursUntilSlot: number } {
  const diffMs = slotTime.getTime() - now.getTime();
  const hoursUntilSlot = diffMs / (1000 * 60 * 60);
  const isWithinWindow = hoursUntilSlot < freeCancelHours;

  const feeAmount = isWithinWindow ? servicePrice : 0;
  const depositCredited = depositAmountPaid > 0 && feeAmount > 0;
  const netPayableFee = Math.max(0, feeAmount - (depositCredited ? depositAmountPaid : 0));

  return {
    feeAmount,
    netPayableFee,
    depositCredited,
    isWithinWindow,
    hoursUntilSlot: Math.max(0, Math.round(hoursUntilSlot * 10) / 10),
  };
}

export function calculateNoShowPenalty(
  servicePrice: number,
  consecutiveNoShows: number,
  isVip: boolean = false,
  depositAmountPaid: number = 0
): { penaltyFee: number; netPenaltyFee: number; depositForfeited: boolean; warningIssued: boolean } {
  if (isVip) {
    return {
      penaltyFee: 0,
      netPenaltyFee: 0,
      depositForfeited: false,
      warningIssued: true,
    };
  }

  const depositForfeited = depositAmountPaid > 0;
  const penaltyFee = consecutiveNoShows >= 2 ? servicePrice : Math.round(servicePrice * 0.5);
  const netPenaltyFee = Math.max(0, penaltyFee - (depositForfeited ? depositAmountPaid : 0));

  return {
    penaltyFee,
    netPenaltyFee,
    depositForfeited,
    warningIssued: consecutiveNoShows === 1,
  };
}

export function calculateDynamicGracePeriod(
  baseFreeCancelHours: number,
  completedVisitsCount: number
): number {
  if (completedVisitsCount >= 10) {
    return baseFreeCancelHours + 2;
  }
  return baseFreeCancelHours;
}
