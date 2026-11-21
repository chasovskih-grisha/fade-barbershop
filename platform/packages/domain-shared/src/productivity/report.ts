import type {
  ChairThroughputResult,
  CommissionPayoutResult,
  ProductivityReportRequest,
  ProductivityReportResult,
  ServiceDurationRecommendationResult,
} from './types';

export interface ProductivityReportParts {
  request: ProductivityReportRequest;
  chairThroughput: ChairThroughputResult;
  serviceDurationRecommendations: ServiceDurationRecommendationResult[];
  payoutSummary: CommissionPayoutResult;
}

function resolveBadge(overallScore: number): ProductivityReportResult['productivityBadge'] {
  if (overallScore >= 90) return 'Elite Performer';
  if (overallScore >= 75) return 'High Growth';
  if (overallScore >= 50) return 'Steady Operator';
  return 'Needs Optimization';
}

export function buildProductivityReport(parts: ProductivityReportParts): ProductivityReportResult {
  const { request, chairThroughput, serviceDurationRecommendations, payoutSummary } = parts;
  const utilScore = chairThroughput.averageUtilizationRate * 60;
  const revScore = Math.min(40, (payoutSummary.totalServiceRevenue / 50000) * 40);
  const overallScore = Math.min(100, Math.round(utilScore + revScore));

  return {
    barberId: request.barberId,
    chairThroughput,
    serviceDurationRecommendations,
    payoutSummary,
    overallScore,
    productivityBadge: resolveBadge(overallScore),
  };
}
