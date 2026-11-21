export interface NotificationPreferences {
  smsReminders: boolean;
  emailUpdates: boolean;
  pushNotifications: boolean;
  marketingOffers: boolean;
}

export interface NotificationToggleOption {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  bordered: boolean;
}

export const NOTIFICATION_TOGGLE_OPTIONS: NotificationToggleOption[] = [
  {
    key: 'smsReminders',
    label: 'SMS-нагадування',
    description: 'Отримувати нагадування про візит за 2 години',
    bordered: true,
  },
  {
    key: 'emailUpdates',
    label: 'Email-підтвердження',
    description: 'Деталі запису, чеки та зміна статусу візиту',
    bordered: true,
  },
  {
    key: 'pushNotifications',
    label: 'Push-сповіщення',
    description: 'Сповіщення в браузері про статус запису та майстра',
    bordered: true,
  },
  {
    key: 'marketingOffers',
    label: 'Маркетингові пропозиції',
    description: 'Спеціальні знижки, подарункові акції та новинки',
    bordered: false,
  },
];
