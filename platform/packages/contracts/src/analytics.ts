export type EmissionSource = 'client' | 'server';

export type EventPriority = 'P1' | 'P2';

export type CoreEventName =
  | 'page_view'
  | 'cta_booking_click'
  | 'location_select'
  | 'service_view'
  | 'barber_view'
  | 'auth_phone_submitted'
  | 'auth_otp_submitted'
  | 'auth_otp_verified'
  | 'auth_otp_failed'
  | 'auth_otp_resent'
  | 'booking_started'
  | 'booking_location_selected'
  | 'booking_service_selected'
  | 'booking_barber_selected'
  | 'booking_slot_selected'
  | 'booking_comment_added'
  | 'booking_promo_applied'
  | 'booking_confirmed'
  | 'booking_payment_initiated'
  | 'booking_payment_succeeded'
  | 'booking_payment_failed'
  | 'client_profile_viewed'
  | 'client_profile_updated'
  | 'client_appointments_viewed'
  | 'client_appointment_cancelled'
  | 'client_review_submitted';

export interface BaseEventParams {
  event_id: string; // uuid
  insert_id: string; // dedupe id
  session_id: string;
  anon_id: string;
  user_id?: string;
  env: 'development' | 'staging' | 'production';
  consent_state: boolean;
  ts: number;
}

export interface EventDef<TParams extends Record<string, any> = Record<string, any>> {
  name: CoreEventName;
  params: TParams & BaseEventParams;
  emission: EmissionSource;
  ga4: {
    send: boolean;
    priority: EventPriority;
  };
  allowInAdmin: boolean;
}
