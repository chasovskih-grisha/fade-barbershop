/* eslint-disable max-lines, complexity, max-statements -- cohesive module (134 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: generateReport, complexity 25 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: generateReport, 40 statements vs 30); extraction tracked in T-2500f */
/**
 * FADE Analytics & Conversion Intelligence Engine
 * Domain model for conversion funnel tracking, drop-off analysis, and behavioral instrumentation.
 */

export type FunnelStep =
  | 'LANDING_VIEW'
  | 'SERVICE_SELECT'
  | 'BARBER_SELECT'
  | 'SLOT_SELECT'
  | 'CONTACT_AUTH'
  | 'PAYMENT_INIT'
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_COMPLETED';

export interface FunnelEventRecord {
  step: FunnelStep;
  clientId?: string;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface FunnelStepMetrics {
  step: FunnelStep;
  enteredCount: number;
  completedCount: number;
  dropOffCount: number;
  dropOffRatePercent: number;
}

export interface ConversionFunnelReport {
  sessionId?: string;
  totalSessions: number;
  steps: FunnelStepMetrics[];
  overallConversionRatePercent: number;
  criticalDropOffStep: FunnelStep | null;
  recommendations: string[];
}

export const FUNNEL_STEP_SEQUENCE: FunnelStep[] = [
  'LANDING_VIEW',
  'SERVICE_SELECT',
  'BARBER_SELECT',
  'SLOT_SELECT',
  'CONTACT_AUTH',
  'PAYMENT_INIT',
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_COMPLETED',
];

export class ConversionFunnelTracker {
  private events: FunnelEventRecord[] = [];

  constructor(initialEvents: FunnelEventRecord[] = []) {
    this.events = [...initialEvents];
  }

  public recordEvent(event: FunnelEventRecord): void {
    this.events.push({
      ...event,
      timestamp: event.timestamp || new Date(),
    });
  }

  public getEvents(): readonly FunnelEventRecord[] {
    return this.events;
  }

  public generateReport(): ConversionFunnelReport {
    const sessionMap = new Map<string, Set<FunnelStep>>();

    for (const ev of this.events) {
      const steps = sessionMap.get(ev.sessionId) ?? new Set<FunnelStep>();
      steps.add(ev.step);
      sessionMap.set(ev.sessionId, steps);
    }

    const totalSessions = sessionMap.size;
    const stepCounts = new Map<FunnelStep, number>();

    for (const step of FUNNEL_STEP_SEQUENCE) {
      stepCounts.set(step, 0);
    }

    for (const [, stepsSet] of sessionMap.entries()) {
      for (const step of stepsSet) {
        stepCounts.set(step, (stepCounts.get(step) || 0) + 1);
      }
    }

    const stepsMetrics: FunnelStepMetrics[] = [];

    for (let i = 0; i < FUNNEL_STEP_SEQUENCE.length; i++) {
      const currentStep = FUNNEL_STEP_SEQUENCE[i];
      if (!currentStep) continue;
      const enteredCount = i === 0 ? totalSessions : stepCounts.get(currentStep) || 0;
      const nextStep = FUNNEL_STEP_SEQUENCE[i + 1];
      const completedCount = nextStep ? stepCounts.get(nextStep) || 0 : enteredCount;
      const dropOffCount = Math.max(0, enteredCount - completedCount);
      const dropOffRatePercent =
        enteredCount > 0 ? Number(((dropOffCount / enteredCount) * 100).toFixed(2)) : 0;

      stepsMetrics.push({
        step: currentStep,
        enteredCount,
        completedCount,
        dropOffCount,
        dropOffRatePercent,
      });
    }

    const landingCount = totalSessions;
    const completedCount = stepCounts.get('APPOINTMENT_COMPLETED') || 0;
    const overallConversionRatePercent =
      landingCount > 0 ? Number(((completedCount / landingCount) * 100).toFixed(2)) : 0;

    let criticalDropOffStep: FunnelStep | null = null;
    let maxDropOff = -1;

    for (const sm of stepsMetrics) {
      if (sm.dropOffRatePercent > maxDropOff && sm.enteredCount > 0) {
        maxDropOff = sm.dropOffRatePercent;
        criticalDropOffStep = sm.step;
      }
    }

    const recommendations: string[] = [];
    if (criticalDropOffStep === 'CONTACT_AUTH') {
      recommendations.push(
        'High drop-off at CONTACT_AUTH. Consider implementing one-tap SMS OTP auto-fill or guest checkout preview to reduce friction.'
      );
    } else if (criticalDropOffStep === 'SLOT_SELECT') {
      recommendations.push(
        'High drop-off at SLOT_SELECT. Ensure calendar shows available slots immediately without extra taps or loading delays.'
      );
    } else if (criticalDropOffStep === 'PAYMENT_INIT') {
      recommendations.push(
        'High drop-off at PAYMENT_INIT. Support Apple Pay / Google Pay and saved cards to streamline deposit capture.'
      );
    } else if (criticalDropOffStep) {
      recommendations.push(
        `Critical drop-off detected at ${criticalDropOffStep} (${maxDropOff}% drop-off). Investigate UI friction at this stage.`
      );
    }

    if (overallConversionRatePercent < 15 && totalSessions >= 10) {
      recommendations.push(
        'Overall conversion rate is below 15%. Review pricing psychology, incentives, and page load performance.'
      );
    }

    return {
      totalSessions,
      steps: stepsMetrics,
      overallConversionRatePercent,
      criticalDropOffStep,
      recommendations,
    };
  }
}
