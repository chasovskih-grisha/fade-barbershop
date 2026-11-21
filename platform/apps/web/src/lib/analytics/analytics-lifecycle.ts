import { trackEvent } from './analytics-core';

export interface WaitlistJoinParams {
  locationCode: string;
  serviceId: string;
  barberId?: string;
  preferredDate?: string;
}

export const waitlistAnalytics = {
  joined: (params: WaitlistJoinParams) => {
    trackEvent('waitlist_joined', {
      location_code: params.locationCode,
      service_id: params.serviceId,
      barber_id: params.barberId || '',
      preferred_date: params.preferredDate || '',
    });
  },
  notified: (waitlistId: string, slotStart: string) => {
    trackEvent('waitlist_notified', { waitlist_id: waitlistId, slot_start: slotStart });
  },
  converted: (waitlistId: string, bookingId: string, timeToConvertMinutes?: number) => {
    trackEvent('waitlist_converted', {
      waitlist_id: waitlistId,
      booking_id: bookingId,
      time_to_convert_minutes: timeToConvertMinutes ?? 0,
    });
  },
  dropped: (waitlistId: string, reason: string) => {
    trackEvent('waitlist_dropped', { waitlist_id: waitlistId, reason });
  },
};

export const cancellationAnalytics = {
  reasonSelected: (bookingId: string, reasonCategory: string, customText?: string) => {
    trackEvent('cancellation_reason_selected', {
      booking_id: bookingId,
      reason_category: reasonCategory,
      has_custom_text: Boolean(customText),
    });
  },
  rescheduleAlternativeChosen: (bookingId: string, originalSlot: string, newSlot: string) => {
    trackEvent('cancellation_reschedule_alternative_chosen', {
      booking_id: bookingId,
      original_slot: originalSlot,
      new_slot: newSlot,
    });
  },
  penaltyAcknowledged: (bookingId: string, penaltyAmount: number) => {
    trackEvent('cancellation_penalty_acknowledged', {
      booking_id: bookingId,
      penalty_amount: penaltyAmount,
    });
  },
};
