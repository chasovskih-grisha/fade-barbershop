import {
  fromApiPreferences,
  toApiPreferences,
  NOTIFICATION_DEFAULTS,
} from './notification-preferences';

describe('notification preferences mapping', () => {
  it('maps the card switches onto the API fields', () => {
    expect(
      toApiPreferences({
        smsReminders: false,
        emailUpdates: true,
        pushNotifications: true,
        marketingOffers: false,
      })
    ).toEqual({
      smsEnabled: false,
      emailEnabled: true,
      pushEnabled: true,
      loyaltyOptOut: true,
    });
  });

  it('inverts the loyalty opt-out back into marketing offers', () => {
    expect(fromApiPreferences({ smsEnabled: true, loyaltyOptOut: true })).toMatchObject({
      smsReminders: true,
      marketingOffers: false,
    });
    expect(fromApiPreferences({ loyaltyOptOut: false }).marketingOffers).toBe(true);
  });

  it('falls back to the defaults for missing fields', () => {
    expect(fromApiPreferences({})).toEqual(NOTIFICATION_DEFAULTS);
  });
});
