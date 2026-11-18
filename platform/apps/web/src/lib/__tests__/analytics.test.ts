import {
  bookingAnalytics,
  clientCabinetAnalytics,
  authAnalytics,
  publicPageAnalytics,
  giftCertificatesAnalytics,
  referralAnalytics,
  shopAnalytics,
  loyaltyAnalytics,
  conversionIntelligence,
  abTestAnalytics,
  conversionHealthAnalytics,
  fieldInteractionAnalytics,
  conversionAttributionAnalytics,
  waitlistAnalytics,
  cancellationAnalytics,
  getOrCreateFunnelInstanceId,
  trackEvent,
  getUtmParamsFromUrl,
  persistUtmParams,
  getStoredUtmParams,
} from '../analytics';

describe('Analytics & Conversion Intelligence Wrapper', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.amplitude = {
      track: jest.fn(),
      setUserId: jest.fn(),
    };
    localStorage.clear();
  });

  it('generates a valid funnel instance id', () => {
    const fid = getOrCreateFunnelInstanceId();
    expect(fid).toMatch(/^fn_/);
  });

  it('pushes events to dataLayer and amplitude', () => {
    trackEvent('test_event', { foo: 'bar' });
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'test_event',
        foo: 'bar',
      })
    );
    expect(window.amplitude?.track).toHaveBeenCalledWith(
      'test_event',
      expect.objectContaining({ foo: 'bar' })
    );
  });

  it('handles UTM params parsing, persistence and retrieval', () => {
    const utm = getUtmParamsFromUrl('?utm_source=instagram&utm_medium=cpc&utm_campaign=launch');
    expect(utm).toEqual({
      utm_source: 'instagram',
      utm_medium: 'cpc',
      utm_campaign: 'launch',
    });

    persistUtmParams('?utm_source=telegram&utm_medium=social');
    const stored = getStoredUtmParams();
    expect(stored.utm_source).toBe('telegram');
  });

  it('tracks booking funnel events correctly', () => {
    bookingAnalytics.started('web_test');
    bookingAnalytics.locationSelected('kiev-center');
    bookingAnalytics.serviceSelected({ id: 'svc-1', name: 'Fade Cut', price: 800 });
    bookingAnalytics.barberSelected('barber-1');
    bookingAnalytics.slotSelected('10:00');
    bookingAnalytics.referencePhotoAttached('ai');
    bookingAnalytics.confirmed({
      bookingId: 'book-123',
      locationCode: 'kiev-center',
      serviceId: 'svc-1',
      barberId: 'barber-1',
      bookingValue: 800,
    });

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('booking_started');
    expect(events).toContain('booking_location_selected');
    expect(events).toContain('booking_service_selected');
    expect(events).toContain('booking_barber_selected');
    expect(events).toContain('booking_slot_selected');
    expect(events).toContain('booking_reference_photo_attached');
    expect(events).toContain('booking_confirmed');
  });

  it('tracks client cabinet events correctly', () => {
    clientCabinetAnalytics.viewed('appointments');
    clientCabinetAnalytics.appointmentRescheduled('book-123');
    clientCabinetAnalytics.appointmentCancelled('book-123');
    clientCabinetAnalytics.referenceUpdated('book-123');
    clientCabinetAnalytics.profileUpdated('phone');

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('client_cabinet_viewed');
    expect(events).toContain('client_appointment_rescheduled');
    expect(events).toContain('client_appointment_cancelled');
    expect(events).toContain('client_reference_updated');
    expect(events).toContain('client_profile_updated');
  });

  it('tracks authentication flow events correctly', () => {
    authAnalytics.phoneSubmitted('hash123', true);
    authAnalytics.otpSubmitted(1, 4);
    authAnalytics.otpVerified('user-uuid-1', true, 'client');
    expect(window.amplitude?.setUserId).toHaveBeenCalledWith('user-uuid-1');

    authAnalytics.otpFailed('invalid_code', 1);
    authAnalytics.otpResent(1);
    authAnalytics.logout('user-uuid-1');
    expect(window.amplitude?.setUserId).toHaveBeenCalledWith(null);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('auth_phone_submitted');
    expect(events).toContain('auth_otp_submitted');
    expect(events).toContain('auth_otp_verified');
    expect(events).toContain('auth_otp_failed');
    expect(events).toContain('auth_otp_resent');
    expect(events).toContain('auth_logout');
  });

  it('tracks public website and acquisition funnel events correctly', () => {
    publicPageAnalytics.pageView('Home', '/', 'kiev-center');
    publicPageAnalytics.ctaBookingClick('hero', 'kiev-center');
    publicPageAnalytics.locationSelect('kiev-center', 'Kyiv Center');
    publicPageAnalytics.serviceView('svc-1', 'Fade Cut', 800, 30, 'kiev-center');
    publicPageAnalytics.barberView('barber-1', 'Alex', 'kiev-center');
    publicPageAnalytics.articleView('trend-2026', 'Hair Trends 2026', 4);
    publicPageAnalytics.phoneClick('+380441112233', '/contacts');

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('page_view');
    expect(events).toContain('cta_booking_click');
    expect(events).toContain('location_select');
    expect(events).toContain('service_view');
    expect(events).toContain('barber_view');
    expect(events).toContain('article_view');
    expect(events).toContain('phone_click');
  });

  it('tracks gift certificates and referral events correctly', () => {
    giftCertificatesAnalytics.viewed('kiev-center');
    giftCertificatesAnalytics.selected(1000, 'design-gold');
    giftCertificatesAnalytics.purchased('cert-123', 1000, 'hash_abc');
    giftCertificatesAnalytics.redeemed('cert-123', 1000, 'book-456');

    referralAnalytics.codeCopied('FADE2026');
    referralAnalytics.shared('telegram');
    referralAnalytics.rewardClaimed('rew-789', 200);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('gift_certificate_viewed');
    expect(events).toContain('gift_certificate_selected');
    expect(events).toContain('gift_certificate_purchased');
    expect(events).toContain('gift_certificate_redeemed');
    expect(events).toContain('referral_code_copied');
    expect(events).toContain('referral_shared');
    expect(events).toContain('referral_reward_claimed');
  });

  it('tracks conversion intelligence drop-offs, timers, rage clicks, exit intents, and scroll milestones', () => {
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

  it('tracks shop and loyalty e-commerce events correctly', () => {
    shopAnalytics.productViewed('prod-1', 'Matte Clay', 450, 'styling');
    shopAnalytics.cartAdded('prod-1', 'Matte Clay', 450, 1);
    shopAnalytics.cartRemoved('prod-1', 'Matte Clay');
    shopAnalytics.checkoutStarted(450, 1);
    shopAnalytics.orderCompleted('ord-999', 450, 1);

    loyaltyAnalytics.pointsEarned(50, 'haircut_visit', 350);
    loyaltyAnalytics.tierUpgraded('Gold VIP', 5000);
    loyaltyAnalytics.rewardUnlocked('rew-1', 'Free Beard Trim', 300);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('shop_product_viewed');
    expect(events).toContain('shop_cart_added');
    expect(events).toContain('shop_cart_removed');
    expect(events).toContain('shop_checkout_started');
    expect(events).toContain('shop_order_completed');
    expect(events).toContain('loyalty_points_earned');
    expect(events).toContain('loyalty_tier_upgraded');
    expect(events).toContain('loyalty_reward_unlocked');
  });

  it('tracks AB test variant assignments and conversion lifts correctly', () => {
    abTestAnalytics.experimentAssigned('exp_quick_booking', 'variant_b', { audience: 'vip' });
    abTestAnalytics.experimentConversionLift('exp_quick_booking', 'variant_b', 'booking_completed', 800);
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

  it('tracks field interactions, errors, and form abandonments correctly', () => {
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

  it('tracks conversion attribution touchpoints and cohort allocations correctly', () => {
    conversionAttributionAnalytics.touchpointRecorded('instagram', 'cpc', 'spring_fade', 1);
    conversionAttributionAnalytics.pathResolved('conv-123', 3, 'linear');
    conversionAttributionAnalytics.cohortSegmentAllocated('VIP Returner', 'high_value', 12000);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('attribution_touchpoint_recorded');
    expect(events).toContain('attribution_path_resolved');
    expect(events).toContain('cohort_segment_allocated');
  });

  it('tracks waitlist and cancellation conversion analytics correctly', () => {
    waitlistAnalytics.joined('kiev-center', 'svc-1', 'barber-1', '2026-11-20');
    waitlistAnalytics.notified('wl-1', '10:00');
    waitlistAnalytics.converted('wl-1', 'book-999', 15);
    waitlistAnalytics.dropped('wl-1', 'no_longer_needed');

    cancellationAnalytics.reasonSelected('book-123', 'schedule_change', 'Urgent work meeting');
    cancellationAnalytics.rescheduleAlternativeChosen('book-123', '10:00', '14:00');
    cancellationAnalytics.penaltyAcknowledged('book-123', 200);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('waitlist_joined');
    expect(events).toContain('waitlist_notified');
    expect(events).toContain('waitlist_converted');
    expect(events).toContain('waitlist_dropped');
    expect(events).toContain('cancellation_reason_selected');
    expect(events).toContain('cancellation_reschedule_alternative_chosen');
    expect(events).toContain('cancellation_penalty_acknowledged');
  });
});
