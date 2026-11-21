/**
 * FADE Conversion Intelligence Engine & Advanced Drop-Off Predictor
 * Provides real-time conversion friction scoring, bottleneck analysis, and diagnostic event tracking wrappers.
 */

import { trackEvent } from '../analytics';

export { calculateAdvancedConversionHealth, trackFunnelStepDiagnostics } from './funnel-health';
export type {
  AdvancedFunnelHealthReport,
  FunnelStepAnalysis,
  FunnelStepMetricInput,
} from './funnel-health';

export interface DropOffRiskInput {
  stepIndex: number;
  timeSpentMs: number;
  errorCount: number;
  idleSeconds: number;
}

export interface DropOffRiskAssessment {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryFactor: string;
}

interface RiskFactors {
  score: number;
  primaryFactor: string;
}

/** Scores the three observed friction signals and names the dominant one. */
function scoreFriction(input: DropOffRiskInput): RiskFactors {
  // Time spent factor (more than 45s per step increases friction)
  const timeScore = Math.min(
    40,
    input.timeSpentMs / 1000 > 45 ? (input.timeSpentMs / 1000 - 45) * 0.8 : 0
  );
  let primaryFactor = 'none';
  if (timeScore > 15) primaryFactor = 'high_time_spent';

  // Error count factor (each error adds significant drop-off risk)
  const errorScore = input.errorCount * 25;
  if (errorScore > 20 && errorScore >= timeScore) primaryFactor = 'form_validation_errors';

  // Idle seconds factor
  const idleScore = Math.min(20, input.idleSeconds * 0.5);
  if (idleScore > 10 && idleScore > timeScore && idleScore > errorScore)
    primaryFactor = 'user_idle';

  return { score: timeScore + errorScore + idleScore, primaryFactor };
}

function resolveRiskLevel(score: number): DropOffRiskAssessment['riskLevel'] {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

/**
 * Predicts drop-off risk based on user behavior telemetry (time spent, errors, idle time).
 */
export function predictDropOffRiskScore(input: DropOffRiskInput): DropOffRiskAssessment {
  const { score, primaryFactor } = scoreFriction(input);
  const riskScore = Math.min(100, Math.round(score));
  const riskLevel = resolveRiskLevel(riskScore);

  trackEvent('conversion_dropoff_risk_calculated', {
    step_index: input.stepIndex,
    risk_score: riskScore,
    risk_level: riskLevel,
    primary_factor: primaryFactor,
  });

  return { riskScore, riskLevel, primaryFactor };
}
