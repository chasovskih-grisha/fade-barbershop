import { getStoredUtmParams, resetFunnelInstanceId, trackEvent } from './analytics-core';

export const bookingAnalytics = {
  started: (entryPoint: string = 'web_direct') => {
    const fid = resetFunnelInstanceId();
    trackEvent('booking_started', {
      funnel_instance_id: fid,
      entry_point: entryPoint,
      ...getStoredUtmParams(),
    });
    return fid;
  },
  locationSelected: (locationCode: string) => {
    trackEvent('booking_location_selected', { location_code: locationCode });
  },
  serviceSelected: (service: {
    id: string;
    name: string;
    price: number;
    durationMinutes?: number;
  }) => {
    trackEvent('booking_service_selected', {
      service_id: service.id,
      service_name: service.name,
      price: service.price,
      duration_minutes: service.durationMinutes ?? 30,
    });
  },
  barberSelected: (barberId?: string) => {
    trackEvent('booking_barber_selected', { barber_id: barberId || '', is_any_barber: !barberId });
  },
  slotSelected: (slotStart: string, dayOffset: number = 0) => {
    trackEvent('booking_slot_selected', { slot_start: slotStart, day_offset: dayOffset });
  },
  stepAbandoned: (
    stepName: string,
    stepIndex: number,
    extraParams: Record<string, unknown> = {}
  ) => {
    trackEvent('booking_step_abandoned', {
      abandoned_step: stepName,
      step_index: stepIndex,
      ...extraParams,
    });
  },
  referencePhotoAttached: (sourceType: 'ai' | 'upload' | 'catalog') => {
    trackEvent('booking_reference_photo_attached', { source_type: sourceType });
  },
  confirmed: (data: {
    bookingId: string;
    locationCode: string;
    serviceId: string;
    barberId?: string;
    bookingValue: number;
    durationMinutes?: number;
  }) => {
    trackEvent('booking_confirmed', {
      booking_id: data.bookingId,
      location_code: data.locationCode,
      service_id: data.serviceId,
      barber_id: data.barberId || '',
      booking_value: data.bookingValue,
      duration_minutes: data.durationMinutes ?? 30,
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
