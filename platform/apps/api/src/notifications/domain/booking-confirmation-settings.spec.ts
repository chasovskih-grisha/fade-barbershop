// Специфікація парсера налаштування каналу (патерн geocoder-settings):
// невідоме значення/сміття/відсутність — безпечно деградує до дефолту.
import { DEFAULT_BOOKING_CONFIRMATION, parseBookingConfirmationSettings } from './booking-confirmation-settings';

describe('booking-confirmation-settings (канал підтвердження)', () => {
  it('валідні канали проходять як є', () => {
    for (const channel of ['email', 'sms', 'both', 'none'] as const) {
      expect(parseBookingConfirmationSettings({ channel })).toEqual({ channel });
    }
  });

  it('невідоме значення, сміття і null → дефолт email', () => {
    expect(parseBookingConfirmationSettings({ channel: 'fax' })).toEqual(
      DEFAULT_BOOKING_CONFIRMATION
    );
    expect(parseBookingConfirmationSettings('garbage')).toEqual(DEFAULT_BOOKING_CONFIRMATION);
    expect(parseBookingConfirmationSettings(null)).toEqual(DEFAULT_BOOKING_CONFIRMATION);
    expect(parseBookingConfirmationSettings(undefined)).toEqual(DEFAULT_BOOKING_CONFIRMATION);
    expect(parseBookingConfirmationSettings({})).toEqual(DEFAULT_BOOKING_CONFIRMATION);
  });
});
