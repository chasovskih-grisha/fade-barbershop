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

/** Tracks step diagnostics for funnel optimization. */
export function trackFunnelStepDiagnostics(
  stepName: string,
  metrics: { durationMs: number; errorCount: number; retryCount: number }
) {
  trackEvent('funnel_step_diagnostics', {
    step_name: stepName,
    duration_ms: metrics.durationMs,
    error_count: metrics.errorCount,
    retry_count: metrics.retryCount,
  });
}

/** Calculates advanced conversion health across funnel stages and identifies bottlenecks. */
export function calculateAdvancedConversionHealth(
  steps: FunnelStepMetricInput[]
): AdvancedFunnelHealthReport {
  if (!steps || steps.length === 0 || !steps[0]) {
    return {
      overallConversionRate: 0,
      dropOffBottleneck: 'none',
      stepMetrics: [],
    };
  }

  const firstEntered = steps[0]?.enteredCount ?? 0;
  const lastCompleted = steps[steps.length - 1]?.completedCount ?? 0;
  const overallConversionRate =
    firstEntered > 0 ? Number(((lastCompleted / firstEntered) * 100).toFixed(2)) : 0;

  let maxDropOffRate = -1;
  let dropOffBottleneck = steps[0].stepName;

  const stepMetrics: FunnelStepAnalysis[] = steps.map((step) => {
    const conversionRate =
      step.enteredCount > 0
        ? Number(((step.completedCount / step.enteredCount) * 100).toFixed(2))
        : 0;
    const dropOffRate = Number((100 - conversionRate).toFixed(2));

    if (dropOffRate > maxDropOffRate) {
      maxDropOffRate = dropOffRate;
      dropOffBottleneck = step.stepName;
    }

    return { stepName: step.stepName, conversionRate, dropOffRate };
  });

  trackEvent('advanced_funnel_health_analyzed', {
    overall_conversion_rate: overallConversionRate,
    bottleneck_step: dropOffBottleneck,
    total_steps: steps.length,
  });

  return { overallConversionRate, dropOffBottleneck, stepMetrics };
}
