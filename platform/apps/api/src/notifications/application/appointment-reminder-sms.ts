// Текст SMS-нагадування (T-080): чиста функція дані → рядок, до 320 символів
// (обмеження каналу), без HTML за визначенням SMS. Час — Europe/Kyiv
// (formatWhen з шаблону підтвердження, ADR 0001: візити в Україні).
import { formatWhen, type ConfirmationLetterData } from './booking-confirmation-template';

/** Ліміт однієї SMS-сегменти; довший текст оператор розбиває надвоє. */
export const SMS_LENGTH_LIMIT = 320;

/** Однорядковий текст нагадування: коли, де, послуга — лише наявні. */
export function renderReminderSms(data: ConfirmationLetterData): string {
  const parts: string[] = ['FADE: нагадування про візит'];
  const when = formatWhen(data.start);
  if (when) parts.push(when);
  const where = [data.locationName, data.locationAddress].filter(Boolean).join(', ');
  if (where) parts.push(where);
  if (data.serviceName) parts.push(data.serviceName);
  parts.push('Зателефонуйте, якщо плани змінилися.');
  return parts.join('\n');
}
