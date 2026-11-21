import type { ClientNoShowRecord, CancellationPolicyConfig } from './types';

export interface HighRiskEvaluationInput {
  clientId: string;
  noShowCount90d: number;
  cancellationCount90d: number;
  policy: CancellationPolicyConfig;
  isVip?: boolean;
  isExcused?: boolean;
}

export function evaluateHighRiskClient(input: HighRiskEvaluationInput): ClientNoShowRecord {
  const {
    clientId,
    noShowCount90d,
    cancellationCount90d,
    policy,
    isVip = false,
    isExcused = false,
  } = input;

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
  const waivedByVip = policy.vipDepositWaiver === true && isVip;
  const requiresDeposit = isHighRisk && policy.depositForHighRisk && !waivedByVip;

  return {
    clientId,
    noShowCount90d,
    cancellationCount90d,
    isHighRisk,
    requiresFullDeposit: requiresDeposit,
    blockOnlineBooking: requiresDeposit,
    isExcused: false,
  };
}
