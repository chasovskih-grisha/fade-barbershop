import { bookingAnalytics, clientCabinetAnalytics, authAnalytics } from '../analytics';

describe('Analytics — booking, cabinet and auth', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.amplitude = { track: jest.fn(), setUserId: jest.fn() };
    localStorage.clear();
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
});
