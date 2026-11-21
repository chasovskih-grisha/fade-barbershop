import { trackEvent } from './analytics-core';

const stepTimestamps: Record<string, number> = {};

export const conversionIntelligence = {
  startStepTimer: (stepName: string) => {
    if (typeof window !== 'undefined') stepTimestamps[stepName] = Date.now();
  },
  endStepTimer: (stepName: string, extraParams: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined' && stepTimestamps[stepName]) {
      const durationMs = Date.now() - stepTimestamps[stepName];
      delete stepTimestamps[stepName];
      trackEvent('funnel_step_timing', {
        step_name: stepName,
        duration_ms: durationMs,
        ...extraParams,
      });
      return durationMs;
    }
    return 0;
  },
  trackDropOffRisk: (stepName: string, reason: string) => {
    trackEvent('conversion_dropoff_risk', { step_name: stepName, reason });
  },
  trackRageClick: (elementName: string, clickCount: number = 3) => {
    trackEvent('conversion_rage_click', { element_name: elementName, click_count: clickCount });
  },
  trackExitIntent: (currentStep: string) => {
    trackEvent('conversion_exit_intent', { current_step: currentStep });
  },
  trackScrollMilestone: (scrollDepthPercent: number, pagePath: string) => {
    trackEvent('conversion_scroll_milestone', {
      scroll_depth_percent: scrollDepthPercent,
      page_path: pagePath,
    });
  },
};

export const conversionHealthAnalytics = {
  calculateFunnelHealthScore: (completedCount: number, startedCount: number): number => {
    if (startedCount === 0) return 100;
    const score = Math.round((completedCount / startedCount) * 100);
    trackEvent('conversion_health_calculated', {
      completed_count: completedCount,
      started_count: startedCount,
      health_score: score,
    });
    return score;
  },
};

export const fieldInteractionAnalytics = {
  fieldFocused: (fieldName: string, formName: string) => {
    trackEvent('form_field_focused', { field_name: fieldName, form_name: formName });
  },
  fieldBlurred: (fieldName: string, formName: string, timeSpentMs?: number) => {
    trackEvent('form_field_blurred', {
      field_name: fieldName,
      form_name: formName,
      time_spent_ms: timeSpentMs ?? 0,
    });
  },
  fieldError: (fieldName: string, formName: string, errorCode: string) => {
    trackEvent('form_field_error', {
      field_name: fieldName,
      form_name: formName,
      error_code: errorCode,
    });
  },
  formAbandoned: (formName: string, lastActiveField: string, filledFieldsCount: number) => {
    trackEvent('form_abandoned', {
      form_name: formName,
      last_active_field: lastActiveField,
      filled_fields_count: filledFieldsCount,
    });
  },
};
