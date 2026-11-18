/**
 * FADE Conversion Intelligence Engine & Advanced Drop-Off Predictor
 * Provides real-time conversion friction scoring, bottleneck analysis, and diagnostic event tracking wrappers.
 */

import { trackEvent } from '../analytics';

export interface FunnelStepMetricInput {
  stepName: string;
  enteredCount: number;
  completedCount: number;
}

export interface FunnelStepAnalysis {
  stepName: string;
  conversionRate: number;
  dropOffRate: number;
}

export interface AdvancedFunnelHealthReport {
  overallConversionRate: number;
  dropOffBottleneck: string;
  stepMetrics: FunnelStepAnalysis[];
}

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

/**
 * Predicts drop-off risk based on user behavior telemetry (time spent, errors, idle time).
 */
export function predictDropOffRiskScore(input: DropOffRiskInput): DropOffRiskAssessment {
  let score = 0;
  let primaryFactor = 'none';

  // Time spent factor (more than 45s per step increases friction)
  const timeScore = Math.min(40, (input.timeSpentMs / 1000 > 45 ? (input.timeSpentMs / 1000 - 45) * 0.8 : 0));
  score += timeScore;
  if (timeScore > 15) primaryFactor = 'high_time_spent';

  // Error count factor (each error adds significant drop-off risk)
  const errorScore = input.errorCount * 25;
  score += errorScore;
  if (errorScore > 20 && errorScore >= timeScore) primaryFactor = 'form_validation_errors';

  // Idle seconds factor
  const idleScore = Math.min(20, input.idleSeconds * 0.5);
  score += idleScore;
  if (idleScore > 10 && idleScore > timeScore && idleScore > errorScore) primaryFactor = 'user_idle';

  const riskScore = Math.min(100, Math.round(score));

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 25) riskLevel = 'medium';

  trackEvent('conversion_dropoff_risk_calculated', {
    step_index: input.stepIndex,
    risk_score: riskScore,
    risk_level: riskLevel,
    primary_factor: primaryFactor,
  });

  return {
    riskScore,
    riskLevel,
    primaryFactor,
  };
}

/**
 * Tracks step diagnostics for funnel optimization.
 */
export function trackFunnelStepDiagnostics(stepName: string, metrics: { durationMs: number; errorCount: number; retryCount: number }) {
  trackEvent('funnel_step_diagnostics', {
    step_name: stepName,
    duration_ms: metrics.durationMs,
    error_count: metrics.errorCount,
    retry_count: metrics.retryCount,
  });
}

/**
 * Calculates advanced conversion health across funnel stages and identifies bottlenecks.
 */
export function calculateAdvancedConversionHealth(steps: FunnelStepMetricInput[]): AdvancedFunnelHealthReport {
  if (!steps || steps.length === 0 || !steps[0]) {
    return {
      overallConversionRate: 0,
      dropOffBottleneck: 'none',
      stepMetrics: [],
    };
  }

  const firstEntered = steps[0]?.enteredCount ?? 0;
  const lastCompleted = steps[steps.length - 1]?.completedCount ?? 0;
  const overallConversionRate = firstEntered > 0 ? Number(((lastCompleted / firstEntered) * 100).toFixed(2)) : 0;

  let maxDropOffRate = -1;
  let dropOffBottleneck = steps[0].stepName;

  const stepMetrics: FunnelStepAnalysis[] = steps.map((step) => {
    const conversionRate = step.enteredCount > 0 ? Number(((step.completedCount / step.enteredCount) * 100).toFixed(2)) : 0;
    const dropOffRate = Number((100 - conversionRate).toFixed(2));

    if (dropOffRate > maxDropOffRate) {
      maxDropOffRate = dropOffRate;
      dropOffBottleneck = step.stepName;
    }

    return {
      stepName: step.stepName,
      conversionRate,
      dropOffRate,
    };
  });

  trackEvent('advanced_funnel_health_analyzed', {
    overall_conversion_rate: overallConversionRate,
    bottleneck_step: dropOffBottleneck,
    total_steps: steps.length,
  });

  return {
    overallConversionRate,
    dropOffBottleneck,
    stepMetrics,
  };
}
