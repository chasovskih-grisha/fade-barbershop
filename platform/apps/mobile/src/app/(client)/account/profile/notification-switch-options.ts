import type { NotificationPreferences } from '@/lib/notification-preferences';

export interface SwitchOption {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  bordered: boolean;
}

/** Ті самі чотири підписи, що на сайті (T-4722b). */
export const SWITCH_OPTIONS: readonly SwitchOption[] = [
  {
    key: 'smsReminders',
    label: 'SMS-нагадування',
    description: 'Нагадування про візит за 2 години',
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
    description: 'Сповіщення на телефон про статус запису та майстра',
    bordered: true,
  },
  {
    key: 'marketingOffers',
    label: 'Маркетингові пропозиції',
    description: 'Спеціальні знижки, подарункові акції та новинки',
    bordered: false,
  },
];
