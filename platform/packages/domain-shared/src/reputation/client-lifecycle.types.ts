export interface ReviewRequestTimingOptimizationRequest {
  clientName: string;
  service: string;
  barber: string;
  appointmentCompletionHour: number; // 0-23
  preferredChannel?: 'SMS' | 'Push' | 'Email';
  clientPastVisitsCount: number;
}

export interface ReviewRequestTimingOptimizationResult {
  optimalDelayMinutes: number;
  recommendedChannel: 'SMS' | 'Push' | 'Email';
  predictedConversionRatePct: number;
  predictedPositiveSentimentLikelihoodPct: number;
  rationale: string;
}

export interface ClientChurnRiskPredictionRequest {
  clientId: string;
  clientName: string;
  recentRating: number;
  recentComment: string;
  daysSinceLastVisit: number;
  totalVisitsCount: number;
  averageSpend: number;
}

export interface ClientChurnRiskPredictionResult {
  clientId: string;
  clientName: string;
  churnRiskScore: number; // 0 to 100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  recommendedRetentionAction: string;
  voucherSuggested: boolean;
  voucherAmount: number;
}
