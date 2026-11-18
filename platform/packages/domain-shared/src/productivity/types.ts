export interface ChairUtilizationRecord {
  barberId: string;
  chairId: string;
  date: string;
  totalWorkingMinutes: number;
  bookedServiceMinutes: number;
  idleGaps: Array<{ start: string; end: string; durationMinutes: number }>;
  walkInCount: number;
}

export interface ServiceDurationRecord {
  serviceId: string;
  serviceName: string;
  standardDurationMinutes: number;
  historicalActualDurationsMinutes: number[];
}

export interface CommissionConfig {
  baseCommissionPct: number; // e.g. 45%
  retailBonusPct: number; // e.g. 10%
  utilizationBonusThresholdPct: number; // e.g. 80%
  utilizationBonusPct: number; // e.g. 5%
  chairRentalFixedFee?: number; // New feature: support booth rental / hybrid commission structures
}

export interface AppointmentCommissionInput {
  appointmentId: string;
  barberId: string;
  serviceRevenue: number;
  retailRevenue: number;
  tips: number;
  utilizationRate: number;
}

export interface ProductivityReportRequest {
  barberId: string;
  chairRecords: ChairUtilizationRecord[];
  serviceRecords: ServiceDurationRecord[];
  appointments: AppointmentCommissionInput[];
  commissionConfig: CommissionConfig;
}

export interface ChairThroughputResult {
  averageUtilizationRate: number;
  peakHourCongestionScore: number; // 0 to 100
  totalIdleMinutes: number;
  recommendedGapCompressionAction: string;
  dynamicBufferRecommendedMinutes: number; // New feature: smart buffer recommendation to avoid back-to-back fatigue
  chairTurnaroundEfficiencyRating: 'Optimal' | 'Under-utilized' | 'Over-congested'; // New feature: turnaround efficiency
}

export interface ServiceDurationRecommendationResult {
  serviceId: string;
  serviceName: string;
  currentStandardMinutes: number;
  recommendedMinutes: number;
  adjustmentReason: string;
  revenueImpactEstimate: number; // New feature: estimated monthly revenue gain from optimized service slotting
}

export interface CommissionPayoutResult {
  totalServiceRevenue: number;
  totalRetailRevenue: number;
  totalTips: number;
  baseCommissionAmount: number;
  retailBonusAmount: number;
  utilizationBonusAmount: number;
  chairRentalDeduction: number; // New feature
  totalPayout: number;
  commissionTier: 'bronze' | 'silver' | 'gold' | 'master';
  projectedAnnualEarnings: number; // New feature: projected annualized earnings based on current velocity
}

export interface ProductivityReportResult {
  barberId: string;
  chairThroughput: ChairThroughputResult;
  serviceDurationRecommendations: ServiceDurationRecommendationResult[];
  payoutSummary: CommissionPayoutResult;
  overallScore: number; // 0 to 100
  productivityBadge: 'Elite Performer' | 'High Growth' | 'Steady Operator' | 'Needs Optimization'; // New feature: actionable tier badge
}
