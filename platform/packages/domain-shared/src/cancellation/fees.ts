export interface CancellationFeeInput {
  slotTime: Date;
  now: Date;
  servicePrice: number;
  freeCancelHours: number;
  depositAmountPaid?: number;
}

export interface CancellationFeeResult {
  feeAmount: number;
  netPayableFee: number;
  depositCredited: boolean;
  isWithinWindow: boolean;
  hoursUntilSlot: number;
}

export interface NoShowPenaltyInput {
  servicePrice: number;
  consecutiveNoShows: number;
  isVip?: boolean;
  depositAmountPaid?: number;
}

export interface NoShowPenaltyResult {
  penaltyFee: number;
  netPenaltyFee: number;
  depositForfeited: boolean;
  warningIssued: boolean;
}

export function calculateCancellationFee(input: CancellationFeeInput): CancellationFeeResult {
  const { slotTime, now, servicePrice, freeCancelHours, depositAmountPaid = 0 } = input;
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

export function calculateNoShowPenalty(input: NoShowPenaltyInput): NoShowPenaltyResult {
  const { servicePrice, consecutiveNoShows, isVip = false, depositAmountPaid = 0 } = input;

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
  return completedVisitsCount >= 10 ? baseFreeCancelHours + 2 : baseFreeCancelHours;
}
