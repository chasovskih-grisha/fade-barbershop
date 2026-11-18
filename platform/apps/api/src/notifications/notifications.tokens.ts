// Токени ін'єкції notifications (T-4608/T-080): винесені з модуля, щоб
// список провайдерів (notifications.providers.ts) і сам модуль ділили одне
// джерело правди — токени не дублюються літералами.
export const SMS_SENDER = Symbol('NOTIFICATIONS_SMS_SENDER');

/** T-070/T-4422: push-канал пристроїв (реалізація — за PUSH_PROVIDER). */
export const PUSH_SENDER = Symbol('NOTIFICATIONS_PUSH_SENDER');

/** Реєстр споживачів релея: маршрутизація за типом події (outbox-routing). */
export const OUTBOX_CONSUMERS = Symbol('NOTIFICATIONS_OUTBOX_CONSUMERS');
