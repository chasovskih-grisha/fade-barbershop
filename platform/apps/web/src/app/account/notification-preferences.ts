export interface NotificationPreferences {
  smsReminders: boolean;
  emailUpdates: boolean;
  pushNotifications: boolean;
  marketingOffers: boolean;
}

export const NOTIFICATION_DEFAULTS: NotificationPreferences = {
  smsReminders: true,
  emailUpdates: true,
  pushNotifications: false,
  marketingOffers: false,
};

export type ApiNotificationPreferences = {
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  loyaltyOptOut?: boolean;
};

/** Marketing offers ride on the loyalty opt-out: opting out of the programme stops the offers. */
export function toApiPreferences(preferences: NotificationPreferences): ApiNotificationPreferences {
  return {
    smsEnabled: preferences.smsReminders,
    emailEnabled: preferences.emailUpdates,
    pushEnabled: preferences.pushNotifications,
    loyaltyOptOut: !preferences.marketingOffers,
  };
}

export function fromApiPreferences(api: ApiNotificationPreferences): NotificationPreferences {
  return {
    smsReminders: api.smsEnabled ?? NOTIFICATION_DEFAULTS.smsReminders,
    emailUpdates: api.emailEnabled ?? NOTIFICATION_DEFAULTS.emailUpdates,
    pushNotifications: api.pushEnabled ?? NOTIFICATION_DEFAULTS.pushNotifications,
    marketingOffers:
      api.loyaltyOptOut === undefined ? NOTIFICATION_DEFAULTS.marketingOffers : !api.loyaltyOptOut,
  };
}
