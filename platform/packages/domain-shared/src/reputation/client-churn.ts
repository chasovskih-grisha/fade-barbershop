import type { ClientChurnRiskPredictionRequest, ClientChurnRiskPredictionResult } from './types';

type RiskLevel = ClientChurnRiskPredictionResult['riskLevel'];

interface RetentionPlan {
  recommendedRetentionAction: string;
  voucherSuggested: boolean;
  voucherAmount: number;
}

function calculateScore(request: ClientChurnRiskPredictionRequest): number {
  let score = 20;
  if (request.recentRating <= 2) score += 50;
  else if (request.recentRating === 3) score += 25;

  if (request.daysSinceLastVisit > 45) score += 25;
  else if (request.daysSinceLastVisit > 30) score += 15;

  if (request.totalVisitsCount <= 1) score += 10;
  else if (request.totalVisitsCount > 5) score -= 15;

  return Math.min(100, Math.max(0, score));
}

function resolveRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 30) return 'Moderate';
  return 'Low';
}

function buildRetentionPlan(riskLevel: RiskLevel, averageSpend: number): RetentionPlan {
  if (riskLevel === 'Critical' || riskLevel === 'High') {
    const voucherAmount = averageSpend > 0 ? Math.round(averageSpend * 0.5) : 300;
    return {
      voucherSuggested: true,
      voucherAmount,
      recommendedRetentionAction: `Urgent manager outreach required with a complimentary service voucher (UAH ${voucherAmount}) and personal barber re-assignment.`,
    };
  }

  if (riskLevel === 'Moderate') {
    return {
      voucherSuggested: true,
      voucherAmount: 150,
      recommendedRetentionAction:
        'Automated win-back SMS with 15% discount on next haircut service.',
    };
  }

  return {
    voucherSuggested: false,
    voucherAmount: 0,
    recommendedRetentionAction: 'Send standard newsletter and booking reminder.',
  };
}

/**
 * Predict client churn risk based on recent rating, sentiment, days since last visit, and historical value.
 */
export function predictClientChurnRisk(
  request: ClientChurnRiskPredictionRequest
): ClientChurnRiskPredictionResult {
  const { clientId, clientName, averageSpend } = request;
  const churnRiskScore = calculateScore(request);
  const riskLevel = resolveRiskLevel(churnRiskScore);
  const plan = buildRetentionPlan(riskLevel, averageSpend);

  return {
    clientId,
    clientName,
    churnRiskScore,
    riskLevel,
    recommendedRetentionAction: plan.recommendedRetentionAction,
    voucherSuggested: plan.voucherSuggested,
    voucherAmount: plan.voucherAmount,
  };
}
