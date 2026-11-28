import {
  fromApiPreferences,
  toApiPreferences,
  NOTIFICATION_DEFAULTS,
} from './notification-preferences';

describe('notification preferences (T-4722c)', () => {
  it('sends the marketing switch as the inverted loyalty opt-out', () => {
    expect(
      toApiPreferences({ ...NOTIFICATION_DEFAULTS, smsReminders: false, marketingOffers: true })
    ).toEqual({
      smsEnabled: false,
      emailEnabled: true,
      pushEnabled: false,
      loyaltyOptOut: false,
    });
  });

  it('reads the site values back', () => {
    expect(
      fromApiPreferences({
        smsEnabled: true,
        emailEnabled: false,
        pushEnabled: true,
        loyaltyOptOut: true,
      })
    ).toEqual({
      smsReminders: true,
      emailUpdates: false,
      pushNotifications: true,
      marketingOffers: false,
    });
  });

  it('falls back to the defaults when the site has no values yet', () => {
    expect(fromApiPreferences({})).toEqual(NOTIFICATION_DEFAULTS);
  });
});
