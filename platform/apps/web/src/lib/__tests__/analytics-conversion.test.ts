import {
  conversionIntelligence,
  abTestAnalytics,
  conversionHealthAnalytics,
  fieldInteractionAnalytics,
  conversionAttributionAnalytics,
} from '../analytics';

describe('Analytics — conversion intelligence', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.amplitude = { track: jest.fn(), setUserId: jest.fn() };
    localStorage.clear();
  });

  it('tracks drop-offs, timers, rage clicks, exit intents and scroll milestones', () => {
    conversionIntelligence.startStepTimer('service_select');
    conversionIntelligence.trackDropOffRisk('service_select', 'long_load');
    conversionIntelligence.trackRageClick('confirm_btn', 4);
    conversionIntelligence.trackExitIntent('slot_picker');
    conversionIntelligence.trackScrollMilestone(75, '/booking');
    const duration = conversionIntelligence.endStepTimer('service_select');

    expect(duration).toBeGreaterThanOrEqual(0);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('conversion_dropoff_risk');
    expect(events).toContain('conversion_rage_click');
    expect(events).toContain('conversion_exit_intent');
    expect(events).toContain('conversion_scroll_milestone');
    expect(events).toContain('funnel_step_timing');
  });

  it('tracks AB test variant assignments and conversion lifts correctly', () => {
    abTestAnalytics.experimentAssigned('exp_quick_booking', 'variant_b', { audience: 'vip' });
    abTestAnalytics.experimentConversionLift({
      experimentId: 'exp_quick_booking',
      variantName: 'variant_b',
      conversionType: 'booking_completed',
      value: 800,
    });
    abTestAnalytics.featureFlagExposed('new_pricing_tier', true, 'variant_a');

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('ab_test_experiment_assigned');
    expect(events).toContain('ab_test_conversion_lift');
    expect(events).toContain('feature_flag_exposed');
  });

  it('calculates conversion health score and tracks event', () => {
    const score = conversionHealthAnalytics.calculateFunnelHealthScore(80, 100);
    expect(score).toBe(80);
    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('conversion_health_calculated');
  });

  it('tracks field interactions, errors and form abandonments correctly', () => {
    fieldInteractionAnalytics.fieldFocused('phone', 'booking_form');
    fieldInteractionAnalytics.fieldBlurred('phone', 'booking_form', 1500);
    fieldInteractionAnalytics.fieldError('phone', 'booking_form', 'invalid_format');
    fieldInteractionAnalytics.formAbandoned('booking_form', 'phone', 2);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('form_field_focused');
    expect(events).toContain('form_field_blurred');
    expect(events).toContain('form_field_error');
    expect(events).toContain('form_abandoned');
  });

  it('tracks attribution touchpoints and cohort allocations correctly', () => {
    conversionAttributionAnalytics.touchpointRecorded({
      channel: 'instagram',
      medium: 'cpc',
      campaign: 'spring_fade',
      touchIndex: 1,
    });
    conversionAttributionAnalytics.pathResolved('conv-123', 3, 'linear');
    conversionAttributionAnalytics.cohortSegmentAllocated('VIP Returner', 'high_value', 12000);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('attribution_touchpoint_recorded');
    expect(events).toContain('attribution_path_resolved');
    expect(events).toContain('cohort_segment_allocated');
  });
});
