// Налаштування нагадування про візит (T-080): канал і час у допуску —
// адмін-налаштування за патерном MNG-ADM-18 (BookingConfirmationSettings),
// тобто «зміна інтеграцій не потребує деплою». Значення живе в AppSetting;
// споживач подій читає його перед плануванням нагадування.
// Відписка — операторська (канал none), персональної відписки в кабінці ще
// немає; журнал із унікальним eventId не дає дублювати повтори.

export type ReminderChannel = 'sms' | 'none';

export interface AppointmentReminderSettings {
  /** Кому доставляти нагадування: sms клієнту або вимкнено. */
  readonly channel: ReminderChannel;
  /** За скільки хвилин до початку візиту нагадати. */
  readonly leadMinutes: number;
}

export const DEFAULT_APPOINTMENT_REMINDER: AppointmentReminderSettings = {
  channel: 'sms',
  leadMinutes: 24 * 60,
};

export const REMINDER_SETTING_KEY = 'notifications.appointmentReminder';

/** Нижня межа: менше — нагадування приходить «після» самого візиту. */
export const MIN_LEAD_MINUTES = 15;
/** Верхня межа — тиждень; далі «нагадування» не має сенсу. */
export const MAX_LEAD_MINUTES = 7 * 24 * 60;

const CHANNELS: readonly ReminderChannel[] = ['sms', 'none'];

/** leadMinutes з JSON AppSetting: нечисло/поза межами → дефолт. */
function parseLeadMinutes(raw: unknown): number {
  const value = typeof raw === 'number' ? raw : Number.NaN;
  if (!Number.isFinite(value)) return DEFAULT_APPOINTMENT_REMINDER.leadMinutes;
  const rounded = Math.round(value);
  return Math.min(MAX_LEAD_MINUTES, Math.max(MIN_LEAD_MINUTES, rounded));
}

/** Валідує форму значення налаштування; невідоме/пошкоджене → дефолт. */
export function parseAppointmentReminderSettings(raw: unknown): AppointmentReminderSettings {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as {
    channel?: unknown;
    leadMinutes?: unknown;
  };
  const channel = CHANNELS.includes(source.channel as ReminderChannel)
    ? (source.channel as ReminderChannel)
    : DEFAULT_APPOINTMENT_REMINDER.channel;
  return { channel, leadMinutes: parseLeadMinutes(source.leadMinutes) };
}

/** Порт читання/запису налаштування (інфраструктура — AppSetting). */
export interface AppointmentReminderSettingsPort {
  get(): Promise<AppointmentReminderSettings>;
  set(settings: AppointmentReminderSettings): Promise<void>;
}
