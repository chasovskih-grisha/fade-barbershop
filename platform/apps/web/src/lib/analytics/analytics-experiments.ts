import { getStoredUtmParams, trackEvent } from './analytics-core';

export interface ConversionLiftParams {
  experimentId: string;
  variantName: string;
  conversionType: string;
  value?: number;
}

export interface TouchpointRecordParams {
  channel: string;
  medium: string;
  campaign: string;
  touchIndex: number;
}

export const abTestAnalytics = {
  experimentAssigned: (
    experimentId: string,
    variantName: string,
    context?: Record<string, unknown>
  ) => {
    trackEvent('ab_test_experiment_assigned', {
      experiment_id: experimentId,
      variant_name: variantName,
      ...context,
    });
  },
  experimentConversionLift: (params: ConversionLiftParams) => {
    trackEvent('ab_test_conversion_lift', {
      experiment_id: params.experimentId,
      variant_name: params.variantName,
      conversion_type: params.conversionType,
      value: params.value ?? 1,
    });
  },
  featureFlagExposed: (flagKey: string, enabled: boolean, variant?: string) => {
    trackEvent('feature_flag_exposed', {
      flag_key: flagKey,
      enabled,
      variant: variant || (enabled ? 'enabled' : 'disabled'),
    });
  },
};

export const conversionAttributionAnalytics = {
  touchpointRecorded: (params: TouchpointRecordParams) => {
    trackEvent('attribution_touchpoint_recorded', {
      channel: params.channel,
      medium: params.medium,
      campaign: params.campaign,
      touch_index: params.touchIndex,
      ...getStoredUtmParams(),
    });
  },
  pathResolved: (
    conversionId: string,
    touchpointCount: number,
    attributionModel: 'first_touch' | 'last_touch' | 'linear'
  ) => {
    trackEvent('attribution_path_resolved', {
      conversion_id: conversionId,
      touchpoint_count: touchpointCount,
      attribution_model: attributionModel,
    });
  },
  cohortSegmentAllocated: (
    cohortName: string,
    segmentType: string,
    lifetimeValueEstimate?: number
  ) => {
    trackEvent('cohort_segment_allocated', {
      cohort_name: cohortName,
      segment_type: segmentType,
      ltv_estimate: lifetimeValueEstimate ?? 0,
    });
  },
};
