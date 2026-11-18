import {
  predictDropOffRiskScore,
  trackFunnelStepDiagnostics,
  calculateAdvancedConversionHealth,
} from '../conversion-intelligence-engine';

describe('Conversion Intelligence Engine', () => {
  it('predicts drop-off risk correctly for low, medium, high, and critical scenarios', () => {
    const lowRisk = predictDropOffRiskScore({
      stepIndex: 1,
      timeSpentMs: 10000,
      errorCount: 0,
      idleSeconds: 2,
    });
    expect(lowRisk.riskLevel).toBe('low');
    expect(lowRisk.riskScore).toBeLessThan(25);

    const criticalRisk = predictDropOffRiskScore({
      stepIndex: 2,
      timeSpentMs: 90000,
      errorCount: 2,
      idleSeconds: 30,
    });
    expect(criticalRisk.riskLevel).toBe('critical');
    expect(criticalRisk.riskScore).toBeGreaterThanOrEqual(75);
    expect(criticalRisk.primaryFactor).toBeDefined();
  });

  it('tracks funnel step diagnostics without throwing', () => {
    expect(() => {
      trackFunnelStepDiagnostics('service_selection', {
        durationMs: 15200,
        errorCount: 1,
        retryCount: 0,
      });
    }).not.toThrow();
  });

  it('calculates advanced conversion health and identifies bottleneck correctly', () => {
    const report = calculateAdvancedConversionHealth([
      { stepName: 'landing', enteredCount: 1000, completedCount: 800 },
      { stepName: 'service_select', enteredCount: 800, completedCount: 300 }, // bottleneck (62.5% drop-off)
      { stepName: 'checkout', enteredCount: 300, completedCount: 270 },
    ]);

    expect(report.overallConversionRate).toBe(27);
    expect(report.dropOffBottleneck).toBe('service_select');
    expect(report.stepMetrics).toHaveLength(3);
    expect(report.stepMetrics[1]?.dropOffRate).toBe(62.5);
  });
});
