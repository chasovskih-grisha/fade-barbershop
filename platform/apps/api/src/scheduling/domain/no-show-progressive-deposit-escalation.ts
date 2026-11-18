/**
 * No-Show Progressive Deposit & Strike Escalation Engine
 * FADE Platform — Cancellation & No-Show Protection Specialist
 */

export interface ClientNoShowHistoryRecord {
  clientId: string;
  noShowEvents: Array<{ timestamp: Date; servicePrice: number; wasExcused?: boolean }>;
  adminWaiverActive?: boolean;
  isVip?: boolean;
}

export interface EscalationPolicyConfig {
  rollingWindowDays: number;
  strike1DepositPercent: number; // e.g. 25
  strike2DepositPercent: number; // e.g. 50
  strike3FullPrepaymentPercent: number; // e.g. 100
  suspensionThreshold: number; // e.g. 3 no-shows
  vipWaiverDiscountPercent: number; // e.g. 50% reduction in penalty
}

export const DEFAULT_ESCALATION_CONFIG: EscalationPolicyConfig = {
  rollingWindowDays: 90,
  strike1DepositPercent: 25,
  strike2DepositPercent: 50,
  strike3FullPrepaymentPercent: 100,
  suspensionThreshold: 3,
  vipWaiverDiscountPercent: 50,
};

export interface EscalationAssessmentResult {
  clientId: string;
  activeStrikeCount: number;
  requiredDepositPercent: number;
  isSuspended: boolean;
  policyReason: string;
  recommendedAction: 'NONE' | 'SOFT_WARNING' | 'MANDATORY_DEPOSIT' | 'FULL_PREPAYMENT' | 'ACCOUNT_SUSPENDED';
}

export class NoShowProgressiveDepositEscalationEngine {
  constructor(private config: EscalationPolicyConfig = DEFAULT_ESCALATION_CONFIG) {}

  assessClientEscalation(
    record: ClientNoShowHistoryRecord,
    servicePrice: number,
    now: Date = new Date()
  ): EscalationAssessmentResult {
    const windowStart = new Date(now.getTime() - this.config.rollingWindowDays * 24 * 60 * 60 * 1000);
    
    const activeNoShows = record.noShowEvents.filter(
      (ev) => ev.timestamp.getTime() >= windowStart.getTime() && !ev.wasExcused
    );
    let strikeCount = activeNoShows.length;

    if (record.adminWaiverActive) {
      return {
        clientId: record.clientId,
        activeStrikeCount: strikeCount,
        requiredDepositPercent: 0,
        isSuspended: false,
        policyReason: 'Active administrator waiver exempts client from progressive penalties.',
        recommendedAction: 'NONE',
      };
    }

    if (record.isVip) {
      // VIP clients receive leniency (reduce effective strike count by 1, min 0)
      strikeCount = Math.max(0, strikeCount - 1);
    }

    if (strikeCount >= this.config.suspensionThreshold) {
      return {
        clientId: record.clientId,
        activeStrikeCount: activeNoShows.length,
        requiredDepositPercent: 100,
        isSuspended: true,
        policyReason: `Client has accumulated ${activeNoShows.length} unexcused no-shows within ${this.config.rollingWindowDays} days, exceeding suspension threshold.`,
        recommendedAction: 'ACCOUNT_SUSPENDED',
      };
    }

    if (strikeCount === 2) {
      return {
        clientId: record.clientId,
        activeStrikeCount: activeNoShows.length,
        requiredDepositPercent: this.config.strike2DepositPercent,
        isSuspended: false,
        policyReason: `Client has 2 unexcused no-shows. Mandatory ${this.config.strike2DepositPercent}% deposit required.`,
        recommendedAction: 'MANDATORY_DEPOSIT',
      };
    }

    if (strikeCount === 1) {
      return {
        clientId: record.clientId,
        activeStrikeCount: activeNoShows.length,
        requiredDepositPercent: this.config.strike1DepositPercent,
        isSuspended: false,
        policyReason: `Client has 1 unexcused no-show. Soft ${this.config.strike1DepositPercent}% deposit required.`,
        recommendedAction: 'SOFT_WARNING',
      };
    }

    return {
      clientId: record.clientId,
      activeStrikeCount: activeNoShows.length,
      requiredDepositPercent: 0,
      isSuspended: false,
      policyReason: 'Client has clean no-show record within rolling window.',
      recommendedAction: 'NONE',
    };
  }
}
