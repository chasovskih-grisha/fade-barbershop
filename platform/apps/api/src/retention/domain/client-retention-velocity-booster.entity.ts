export type VelocityRiskLevel = 'HEALTHY' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';

export interface RetentionVelocityPolicy {
  riskLevel: VelocityRiskLevel;
  cadenceRatioThreshold: number; // daysSinceLastVisit / averageCadenceDays
  bonusPointsOffer: number;
  discountPercentage: number;
  actionRequired: string;
}

export const RETENTION_VELOCITY_POLICIES: Record<VelocityRiskLevel, RetentionVelocityPolicy> = {
  HEALTHY: {
    riskLevel: 'HEALTHY',
    cadenceRatioThreshold: 1.0,
    bonusPointsOffer: 50,
    discountPercentage: 0,
    actionRequired: 'Maintain standard engagement & referral prompts',
  },
  WARNING: {
    riskLevel: 'WARNING',
    cadenceRatioThreshold: 1.2,
    bonusPointsOffer: 150,
    discountPercentage: 10,
    actionRequired: 'Send gentle rebooking reminder with 10% grooming voucher',
  },
  HIGH_RISK: {
    riskLevel: 'HIGH_RISK',
    cadenceRatioThreshold: 1.5,
    bonusPointsOffer: 300,
    discountPercentage: 15,
    actionRequired: 'Dispatch priority booking invite with 15% discount code FADE-VELOCITY-15',
  },
  CRITICAL: {
    riskLevel: 'CRITICAL',
    cadenceRatioThreshold: 2.0,
    bonusPointsOffer: 500,
    discountPercentage: 25,
    actionRequired: 'Trigger VIP concierge SMS & complimentary beard trim upgrade',
  },
};

export class ClientRetentionVelocityBooster {
  static evaluateVelocity(averageCadenceDays: number, daysSinceLastVisit: number): {
    riskLevel: VelocityRiskLevel;
    cadenceRatio: number;
    policy: RetentionVelocityPolicy;
    outreachMessage: string;
  } {
    const cadence = Math.max(1, averageCadenceDays);
    const cadenceRatio = Number((daysSinceLastVisit / cadence).toFixed(2));

    let riskLevel: VelocityRiskLevel = 'HEALTHY';
    if (cadenceRatio >= 2.0) {
      riskLevel = 'CRITICAL';
    } else if (cadenceRatio >= 1.5) {
      riskLevel = 'HIGH_RISK';
    } else if (cadenceRatio >= 1.2) {
      riskLevel = 'WARNING';
    }

    const policy = RETENTION_VELOCITY_POLICIES[riskLevel];
    let outreachMessage = `Your grooming cadence is on track. Keep looking sharp!`;

    if (riskLevel === 'WARNING') {
      outreachMessage = `Hey! It's been a little longer than usual since your last fresh cut at FADE. Book this week with code FADE-VELOCITY-15 for 10% off!`;
    } else if (riskLevel === 'HIGH_RISK') {
      outreachMessage = `We miss you in the chair! Your hair is due for a tune-up. Use priority code FADE-VELOCITY-15 for 15% off your next visit plus 300 bonus points.`;
    } else if (riskLevel === 'CRITICAL') {
      outreachMessage = `Urgent VIP Alert: It's been quite a while! Enjoy 25% off and a complimentary hot towel treatment on us when you book your comeback session today.`;
    }

    return {
      riskLevel,
      cadenceRatio,
      policy,
      outreachMessage,
    };
  }
}
