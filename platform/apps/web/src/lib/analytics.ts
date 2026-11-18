/**
 * FADE Analytics & Conversion Intelligence Wrapper (GA4 / GTM DataLayer & Amplitude bridge)
 * Adheres to T-4597 analytics taxonomy and privacy standards (no PII).
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    amplitude?: {
      track?: (eventName: string, props?: Record<string, unknown>) => void;
      setUserId?: (userId: string | null) => void;
    };
  }
}

export type FunnelEventParams = {
  funnel_instance_id?: string;
  entry_point?: string;
  location_code?: string;
  service_id?: string;
  service_name?: string;
  price?: number;
  duration_minutes?: number;
  barber_id?: string;
  is_any_barber?: boolean;
  slot_start?: string;
  day_offset?: number;
  booking_id?: string;
  booking_value?: number;
  error_code?: string;
  failed_step?: string;
  provider?: string;
  [key: string]: unknown;
};

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  [key: string]: unknown;
};

let currentFunnelInstanceId: string | null = null;

export function getOrCreateFunnelInstanceId(): string {
  if (!currentFunnelInstanceId) {
    currentFunnelInstanceId = 'fn_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  }
  return currentFunnelInstanceId;
}

export function resetFunnelInstanceId(): string {
  currentFunnelInstanceId = 'fn_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  return currentFunnelInstanceId;
}

export function getUtmParamsFromUrl(searchQuery?: string): UtmParams {
  if (typeof window === 'undefined' && !searchQuery) return {};
  const query = searchQuery || (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(query);
  const utm: UtmParams = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });
  return utm;
}

export function persistUtmParams(searchQuery?: string): UtmParams {
  if (typeof window === 'undefined') return {};
  const utm = getUtmParamsFromUrl(searchQuery);
  if (Object.keys(utm).length > 0) {
    try {
      localStorage.setItem('fade_utm_params', JSON.stringify(utm));
    } catch {
      // ignore storage errors
    }
  }
  return utm;
}

export function getStoredUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('fade_utm_params');
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return getUtmParamsFromUrl();
}

export function trackEvent(eventName: string, params: FunnelEventParams = {}) {
  const enrichedParams = {
    ...params,
    funnel_instance_id: params.funnel_instance_id || currentFunnelInstanceId,
    timestamp: Date.now(),
  };
  if (typeof window !== 'undefined') {
    if (!window.dataLayer) window.dataLayer = [];
    window.dataLayer.push({ event: eventName, ...enrichedParams });
    if (window.amplitude?.track) window.amplitude.track(eventName, enrichedParams);
  }
}

export const bookingAnalytics = {
  started: (entryPoint: string = 'web_direct') => {
    const fid = resetFunnelInstanceId();
    trackEvent('booking_started', { funnel_instance_id: fid, entry_point: entryPoint, ...getStoredUtmParams() });
    return fid;
  },
  locationSelected: (locationCode: string) => {
    trackEvent('booking_location_selected', { location_code: locationCode });
  },
  serviceSelected: (service: { id: string; name: string; price: number; durationMinutes?: number }) => {
    trackEvent('booking_service_selected', {
      service_id: service.id, service_name: service.name, price: service.price, duration_minutes: service.durationMinutes ?? 30,
    });
  },
  barberSelected: (barberId?: string) => {
    trackEvent('booking_barber_selected', { barber_id: barberId || '', is_any_barber: !barberId });
  },
  slotSelected: (slotStart: string, dayOffset: number = 0) => {
    trackEvent('booking_slot_selected', { slot_start: slotStart, day_offset: dayOffset });
  },
  stepAbandoned: (stepName: string, stepIndex: number, extraParams: Record<string, unknown> = {}) => {
    trackEvent('booking_step_abandoned', {
      abandoned_step: stepName,
      step_index: stepIndex,
      ...extraParams,
    });
  },
  referencePhotoAttached: (sourceType: 'ai' | 'upload' | 'catalog') => {
    trackEvent('booking_reference_photo_attached', { source_type: sourceType });
  },
  confirmed: (data: { bookingId: string; locationCode: string; serviceId: string; barberId?: string; bookingValue: number; durationMinutes?: number }) => {
    trackEvent('booking_confirmed', {
      booking_id: data.bookingId, location_code: data.locationCode, service_id: data.serviceId, barber_id: data.barberId || '', booking_value: data.bookingValue, duration_minutes: data.durationMinutes ?? 30,
    });
  },
  failed: (errorCode: string, failedStep: string) => {
    trackEvent('booking_failed', { error_code: errorCode, failed_step: failedStep });
  },
  paymentFailed: (errorCode: string, provider: 'PAY' | 'DSC' | 'APPLE' | 'GOOGLE') => {
    trackEvent('booking_payment_failed', { error_code: errorCode, provider });
  },
};

export const clientCabinetAnalytics = {
  viewed: (tabName: string) => {
    trackEvent('client_cabinet_viewed', { tab_name: tabName });
  },
  appointmentRescheduled: (bookingId: string) => {
    trackEvent('client_appointment_rescheduled', { booking_id: bookingId });
  },
  appointmentCancelled: (bookingId: string) => {
    trackEvent('client_appointment_cancelled', { booking_id: bookingId });
  },
  referenceUpdated: (bookingId: string) => {
    trackEvent('client_reference_updated', { booking_id: bookingId });
  },
  profileUpdated: (section: string) => {
    trackEvent('client_profile_updated', { section });
  },
};

export const authAnalytics = {
  phoneSubmitted: (phoneE164Hash: string, isNewUser?: boolean) => {
    trackEvent('auth_phone_submitted', {
      phone_e164_hash: phoneE164Hash,
      is_new_user: isNewUser ?? false,
      ...getStoredUtmParams(),
    });
  },
  otpSubmitted: (attemptNumber: number, codeLength: number) => {
    trackEvent('auth_otp_submitted', {
      attempt_number: attemptNumber,
      code_length: codeLength,
    });
  },
  otpVerified: (userId: string, isNewUser: boolean, role: 'client' | 'barber' | 'admin') => {
    trackEvent('auth_otp_verified', {
      user_id: userId,
      is_new_user: isNewUser,
      role,
    });
    if (typeof window !== 'undefined' && window.amplitude && typeof window.amplitude.setUserId === 'function') {
      window.amplitude.setUserId(userId);
    }
  },
  otpFailed: (errorCode: string, attemptNumber: number) => {
    trackEvent('auth_otp_failed', {
      error_code: errorCode,
      attempt_number: attemptNumber,
    });
  },
  otpResent: (resendCount: number) => {
    trackEvent('auth_otp_resent', {
      resend_count: resendCount,
    });
  },
  logout: (userId?: string) => {
    trackEvent('auth_logout', {
      user_id: userId || '',
    });
    if (typeof window !== 'undefined' && window.amplitude && typeof window.amplitude.setUserId === 'function') {
      window.amplitude.setUserId(null);
    }
  },
};

export const publicPageAnalytics = {
  pageView: (pageName: string, pagePath: string, locationCode?: string) => {
    trackEvent('page_view', {
      page_name: pageName,
      page_path: pagePath,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      location_code: locationCode || '',
      ...getStoredUtmParams(),
    });
  },
  ctaBookingClick: (ctaLocation: string, locationCode?: string) => {
    trackEvent('cta_booking_click', {
      cta_location: ctaLocation,
      location_code: locationCode || '',
      ...getStoredUtmParams(),
    });
  },
  locationSelect: (locationCode: string, locationName: string) => {
    trackEvent('location_select', {
      location_code: locationCode,
      location_name: locationName,
    });
  },
  serviceView: (serviceId: string, serviceName: string, price: number, durationMinutes: number, locationCode?: string) => {
    trackEvent('service_view', {
      service_id: serviceId,
      service_name: serviceName,
      price,
      duration_minutes: durationMinutes,
      location_code: locationCode || '',
    });
  },
  barberView: (barberId: string, barberName: string, locationCode?: string) => {
    trackEvent('barber_view', {
      barber_id: barberId,
      barber_name: barberName,
      location_code: locationCode || '',
    });
  },
  articleView: (articleSlug: string, articleTitle: string, readTimeEstimateMinutes: number) => {
    trackEvent('article_view', {
      article_slug: articleSlug,
      article_title: articleTitle,
      read_time_estimate_minutes: readTimeEstimateMinutes,
    });
  },
  phoneClick: (phoneNumber: string, pagePath: string) => {
    trackEvent('phone_click', {
      phone_number: phoneNumber,
      page_path: pagePath,
    });
  },
};

export const giftCertificatesAnalytics = {
  viewed: (locationCode?: string) => {
    trackEvent('gift_certificate_viewed', { location_code: locationCode || '' });
  },
  selected: (amount: number, designId: string) => {
    trackEvent('gift_certificate_selected', { amount, design_id: designId });
  },
  purchased: (certificateId: string, amount: number, recipientEmailHash?: string) => {
    trackEvent('gift_certificate_purchased', {
      certificate_id: certificateId,
      amount,
      recipient_email_hash: recipientEmailHash || '',
    });
  },
  redeemed: (certificateId: string, amount: number, bookingId?: string) => {
    trackEvent('gift_certificate_redeemed', {
      certificate_id: certificateId,
      amount,
      booking_id: bookingId || '',
    });
  },
};

export const referralAnalytics = {
  codeCopied: (referralCode: string) => {
    trackEvent('referral_code_copied', { referral_code: referralCode });
  },
  shared: (channel: 'telegram' | 'viber' | 'whatsapp' | 'copy' | 'qr') => {
    trackEvent('referral_shared', { channel });
  },
  rewardClaimed: (rewardId: string, value: number) => {
    trackEvent('referral_reward_claimed', { reward_id: rewardId, value });
  },
};

export const shopAnalytics = {
  productViewed: (productId: string, productName: string, price: number, category: string) => {
    trackEvent('shop_product_viewed', { product_id: productId, product_name: productName, price, category });
  },
  cartAdded: (productId: string, productName: string, price: number, quantity: number) => {
    trackEvent('shop_cart_added', { product_id: productId, product_name: productName, price, quantity });
  },
  cartRemoved: (productId: string, productName: string) => {
    trackEvent('shop_cart_removed', { product_id: productId, product_name: productName });
  },
  checkoutStarted: (cartValue: number, itemCount: number) => {
    trackEvent('shop_checkout_started', { cart_value: cartValue, item_count: itemCount });
  },
  orderCompleted: (orderId: string, totalValue: number, itemCount: number) => {
    trackEvent('shop_order_completed', { order_id: orderId, total_value: totalValue, item_count: itemCount });
  },
};

export const loyaltyAnalytics = {
  pointsEarned: (points: number, reason: string, balanceAfter: number) => {
    trackEvent('loyalty_points_earned', { points, reason, balance_after: balanceAfter });
  },
  tierUpgraded: (tierName: string, totalSpend: number) => {
    trackEvent('loyalty_tier_upgraded', { tier_name: tierName, total_spend: totalSpend });
  },
  rewardUnlocked: (rewardId: string, rewardName: string, pointsCost: number) => {
    trackEvent('loyalty_reward_unlocked', { reward_id: rewardId, reward_name: rewardName, points_cost: pointsCost });
  },
};

const stepTimestamps: Record<string, number> = {};

export const conversionIntelligence = {
  startStepTimer: (stepName: string) => {
    if (typeof window !== 'undefined') {
      stepTimestamps[stepName] = Date.now();
    }
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
    trackEvent('conversion_dropoff_risk', {
      step_name: stepName,
      reason,
    });
  },
  trackRageClick: (elementName: string, clickCount: number = 3) => {
    trackEvent('conversion_rage_click', {
      element_name: elementName,
      click_count: clickCount,
    });
  },
  trackExitIntent: (currentStep: string) => {
    trackEvent('conversion_exit_intent', {
      current_step: currentStep,
    });
  },
  trackScrollMilestone: (scrollDepthPercent: number, pagePath: string) => {
    trackEvent('conversion_scroll_milestone', {
      scroll_depth_percent: scrollDepthPercent,
      page_path: pagePath,
    });
  },
};

export const abTestAnalytics = {
  experimentAssigned: (experimentId: string, variantName: string, context?: Record<string, unknown>) => {
    trackEvent('ab_test_experiment_assigned', {
      experiment_id: experimentId,
      variant_name: variantName,
      ...context,
    });
  },
  experimentConversionLift: (experimentId: string, variantName: string, conversionType: string, value?: number) => {
    trackEvent('ab_test_conversion_lift', {
      experiment_id: experimentId,
      variant_name: variantName,
      conversion_type: conversionType,
      value: value ?? 1,
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

export const conversionHealthAnalytics = {
  calculateFunnelHealthScore: (completedCount: number, startedCount: number): number => {
    if (startedCount === 0) return 100;
    const score = Math.round((completedCount / startedCount) * 100);
    trackEvent('conversion_health_calculated', { completed_count: completedCount, started_count: startedCount, health_score: score });
    return score;
  },
};

export const fieldInteractionAnalytics = {
  fieldFocused: (fieldName: string, formName: string) => {
    trackEvent('form_field_focused', { field_name: fieldName, form_name: formName });
  },
  fieldBlurred: (fieldName: string, formName: string, timeSpentMs?: number) => {
    trackEvent('form_field_blurred', { field_name: fieldName, form_name: formName, time_spent_ms: timeSpentMs ?? 0 });
  },
  fieldError: (fieldName: string, formName: string, errorCode: string) => {
    trackEvent('form_field_error', { field_name: fieldName, form_name: formName, error_code: errorCode });
  },
  formAbandoned: (formName: string, lastActiveField: string, filledFieldsCount: number) => {
    trackEvent('form_abandoned', { form_name: formName, last_active_field: lastActiveField, filled_fields_count: filledFieldsCount });
  },
};

export const conversionAttributionAnalytics = {
  touchpointRecorded: (channel: string, medium: string, campaign: string, touchIndex: number) => {
    trackEvent('attribution_touchpoint_recorded', { channel, medium, campaign, touch_index: touchIndex, ...getStoredUtmParams() });
  },
  pathResolved: (conversionId: string, touchpointCount: number, attributionModel: 'first_touch' | 'last_touch' | 'linear') => {
    trackEvent('attribution_path_resolved', { conversion_id: conversionId, touchpoint_count: touchpointCount, attribution_model: attributionModel });
  },
  cohortSegmentAllocated: (cohortName: string, segmentType: string, lifetimeValueEstimate?: number) => {
    trackEvent('cohort_segment_allocated', { cohort_name: cohortName, segment_type: segmentType, ltv_estimate: lifetimeValueEstimate ?? 0 });
  },
};

export const waitlistAnalytics = {
  joined: (locationCode: string, serviceId: string, barberId?: string, preferredDate?: string) => {
    trackEvent('waitlist_joined', { location_code: locationCode, service_id: serviceId, barber_id: barberId || '', preferred_date: preferredDate || '' });
  },
  notified: (waitlistId: string, slotStart: string) => {
    trackEvent('waitlist_notified', { waitlist_id: waitlistId, slot_start: slotStart });
  },
  converted: (waitlistId: string, bookingId: string, timeToConvertMinutes?: number) => {
    trackEvent('waitlist_converted', { waitlist_id: waitlistId, booking_id: bookingId, time_to_convert_minutes: timeToConvertMinutes ?? 0 });
  },
  dropped: (waitlistId: string, reason: string) => {
    trackEvent('waitlist_dropped', { waitlist_id: waitlistId, reason });
  },
};

export const cancellationAnalytics = {
  reasonSelected: (bookingId: string, reasonCategory: string, customText?: string) => {
    trackEvent('cancellation_reason_selected', { booking_id: bookingId, reason_category: reasonCategory, has_custom_text: Boolean(customText) });
  },
  rescheduleAlternativeChosen: (bookingId: string, originalSlot: string, newSlot: string) => {
    trackEvent('cancellation_reschedule_alternative_chosen', { booking_id: bookingId, original_slot: originalSlot, new_slot: newSlot });
  },
  penaltyAcknowledged: (bookingId: string, penaltyAmount: number) => {
    trackEvent('cancellation_penalty_acknowledged', { booking_id: bookingId, penalty_amount: penaltyAmount });
  },
};





