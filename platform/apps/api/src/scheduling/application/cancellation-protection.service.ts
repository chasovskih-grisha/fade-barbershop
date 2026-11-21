export interface CancellationPolicyConfig {
  freeCancellationHours: number; // e.g. 24
  lateCancellationHours: number; // e.g. 4
  lateCancellationFeePercent: number; // e.g. 50
  noShowFeePercent: number; // e.g. 100
  depositRequiredNoShowThreshold: number; // e.g. 2 no-shows in 90 days trigger mandatory deposit
  bookingSuspensionNoShowThreshold: number; // e.g. 3 no-shows in 90 days trigger suspension
  vipDepositWaiver?: boolean;
}

export const DEFAULT_CANCELLATION_CONFIG: CancellationPolicyConfig = {
  freeCancellationHours: 24,
  lateCancellationHours: 4,
  lateCancellationFeePercent: 50,
  noShowFeePercent: 100,
  depositRequiredNoShowThreshold: 2,
  bookingSuspensionNoShowThreshold: 3,
  vipDepositWaiver: true,
};

export interface CancellationAssessmentInput {
  appointmentStart: Date;
  cancelledAt: Date;
  servicePrice: number;
  clientNoShowCount90d: number;
  depositPaid?: number;
  isExcused?: boolean;
  isVip?: boolean;
}

export interface CancellationAssessmentResult {
  feeAmount: number;
  refundAmount: number;
  policyApplied: 'FREE' | 'LATE_FEE' | 'NO_SHOW_FORFEIT' | 'EXCUSED';
  requiresDepositForFuture: boolean;
  isBookingSuspended: boolean;
}

export class CancellationProtectionService {
  constructor(private config: CancellationPolicyConfig = DEFAULT_CANCELLATION_CONFIG) {}

  /**
   * Assesses cancellation fee and refund when a booking is cancelled.
   */
  assessCancellation(input: CancellationAssessmentInput): CancellationAssessmentResult {
    const depositPaid = input.depositPaid ?? 0;

    if (input.isExcused) {
      return {
        feeAmount: 0,
        refundAmount: depositPaid,
        policyApplied: 'EXCUSED',
        requiresDepositForFuture: false,
        isBookingSuspended: false,
      };
    }

    const diffHours =
      (input.appointmentStart.getTime() - input.cancelledAt.getTime()) / (1000 * 60 * 60);

    let feeAmount = 0;
    let policyApplied: 'FREE' | 'LATE_FEE' | 'NO_SHOW_FORFEIT' | 'EXCUSED' = 'FREE';

    if (diffHours < 0) {
      // Already past start time -> treated as no-show or late cancellation
      feeAmount = (input.servicePrice * this.config.noShowFeePercent) / 100;
      policyApplied = 'NO_SHOW_FORFEIT';
    } else if (diffHours < this.config.lateCancellationHours) {
      feeAmount = (input.servicePrice * this.config.noShowFeePercent) / 100;
      policyApplied = 'NO_SHOW_FORFEIT';
    } else if (diffHours < this.config.freeCancellationHours) {
      feeAmount = (input.servicePrice * this.config.lateCancellationFeePercent) / 100;
      policyApplied = 'LATE_FEE';
    } else {
      feeAmount = 0;
      policyApplied = 'FREE';
    }

    const refundAmount = Math.max(0, depositPaid - feeAmount);
    const requiresDepositForFuture =
      input.clientNoShowCount90d >= this.config.depositRequiredNoShowThreshold &&
      !(this.config.vipDepositWaiver && input.isVip);
    const isBookingSuspended =
      input.clientNoShowCount90d >= this.config.bookingSuspensionNoShowThreshold &&
      !(this.config.vipDepositWaiver && input.isVip);

    return {
      feeAmount,
      refundAmount,
      policyApplied,
      requiresDepositForFuture,
      isBookingSuspended,
    };
  }

  /**
   * Determines if a client requires an automated deposit for new bookings.
   */
  requiresDeposit(
    clientNoShowCount90d: number,
    servicePrice: number,
    priceThresholdForDeposit: number = 1500
  ): boolean {
    return (
      clientNoShowCount90d >= this.config.depositRequiredNoShowThreshold ||
      servicePrice >= priceThresholdForDeposit
    );
  }

  /**
   * Calculates dynamic turnaround buffer minutes based on service duration and client history risk.
   */
  calculateDynamicBufferMinutes(serviceDuration: number, clientNoShowCount90d: number): number {
    let baseBuffer = 5; // standard 5 min cleanup buffer
    if (clientNoShowCount90d >= 1) {
      baseBuffer += 5 * clientNoShowCount90d; // add extra buffer for risk clients
    }
    if (serviceDuration >= 60) {
      baseBuffer += 10; // extra buffer for long premium services
    }
    return baseBuffer;
  }
}
