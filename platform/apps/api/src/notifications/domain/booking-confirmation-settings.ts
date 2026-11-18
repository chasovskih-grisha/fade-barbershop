// Налаштування підтвердження запису (канал email/sms): адмін-налаштування
// за патерном MNG-ADM-18 (geocoder) — «зміна інтеграцій не потребує деплою».
// Значення живе в AppSetting, споживач подій читає його перед відправкою.
// email → «офіс запису» (email локації, T-4608 як є); sms → клієнту
// (Booking.clientId → User.phone); both — обидва; none — вимкнено.

export type ConfirmationChannel = 'email' | 'sms' | 'both' | 'none';

export interface BookingConfirmationSettings {
  /** Кому доставляти підтвердження події scheduling.appointment.booked. */
  readonly channel: ConfirmationChannel;
}

export const DEFAULT_BOOKING_CONFIRMATION: BookingConfirmationSettings = {
  channel: 'email',
};

export const SETTING_KEY = 'notifications.bookingConfirmation';

const CHANNELS: readonly ConfirmationChannel[] = ['email', 'sms', 'both', 'none'];

/** Валідує форму значення налаштування (з JSON AppSetting); невідоме → дефолт. */
export function parseBookingConfirmationSettings(raw: unknown): BookingConfirmationSettings {
  const channel =
    typeof raw === 'object' &&
    raw !== null &&
    CHANNELS.includes((raw as { channel?: unknown }).channel as ConfirmationChannel)
      ? (raw as { channel: ConfirmationChannel }).channel
      : DEFAULT_BOOKING_CONFIRMATION.channel;
  return { channel };
}

/** Порт читання/запису налаштування (інфраструктура — AppSetting). */
export interface BookingConfirmationSettingsPort {
  get(): Promise<BookingConfirmationSettings>;
}
