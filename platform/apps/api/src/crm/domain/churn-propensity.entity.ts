export class InvalidChurnScoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidChurnScoreError';
  }
}

export interface ChurnPropensityData {
  clientId: string;
  score: number;
  riskCohort: 'LOW' | 'MEDIUM' | 'HIGH' | 'CHURNING';
  lastVisitDaysAgo: number;
  expectedIntervalDays: number;
  calculatedAt: Date;
}

export class ChurnPropensityScore {
  public readonly clientId: string;
  public readonly score: number;
  public readonly riskCohort: ChurnPropensityData['riskCohort'];
  public readonly lastVisitDaysAgo: number;
  public readonly expectedIntervalDays: number;
  public readonly calculatedAt: Date;

  constructor(data: ChurnPropensityData) {
    if (data.score < 0 || data.score > 1) {
      throw new InvalidChurnScoreError('Churn propensity score must be between 0.0 and 1.0');
    }
    this.clientId = data.clientId;
    this.score = data.score;
    this.riskCohort = data.riskCohort;
    this.lastVisitDaysAgo = data.lastVisitDaysAgo;
    this.expectedIntervalDays = data.expectedIntervalDays;
    this.calculatedAt = data.calculatedAt;
  }

  public isAtRisk(): boolean {
    return this.score >= 0.75;
  }
}
