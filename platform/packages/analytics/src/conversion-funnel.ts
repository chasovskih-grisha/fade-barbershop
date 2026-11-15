import { Logger, telemetry } from './telemetry';

export interface FunnelStep {
  stepName: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class ConversionFunnelTracker {
  private funnelName: string;
  private steps: FunnelStep[] = [];

  constructor(funnelName: string) {
    this.funnelName = funnelName;
  }

  public trackStep(stepName: string, userId?: string, metadata?: Record<string, any>): void {
    const step: FunnelStep = {
      stepName,
      timestamp: new Date().toISOString(),
      userId,
      metadata,
    };
    this.steps.push(step);
    telemetry.recordMetric(`funnel_${this.funnelName}_step`, 1, { stepName, userId: userId || 'anonymous' });
    Logger.info(`Funnel [${this.funnelName}] stepped to: ${stepName}`, { step });
  }

  public getSteps(): FunnelStep[] {
    return [...this.steps];
  }

  public getCompletionRate(): number {
    if (this.steps.length === 0) return 0;
    // Simple heuristic completion rate based on recorded steps
    return (this.steps.length / 5) * 100; // assuming a standard 5-step conversion funnel
  }
}
