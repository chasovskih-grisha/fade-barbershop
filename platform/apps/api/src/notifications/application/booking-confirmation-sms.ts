// SMS підтвердження запису: чиста функція дані → текст, і порт SmsSender
// (інфраструктура — Mailpit «SMS як email», патерн MailpitOtpSender identity).
// Текст ≤320 символів: коли, де, послуга — без HTML за визначенням каналу.

import { formatWhen, type ConfirmationLetterData } from './booking-confirmation-template';

export interface SmsInput {
  to: string;
  text: string;
}

export interface SmsSender {
  send(input: SmsInput): Promise<void>;
}

/** Однорядковий текст SMS; порожні секції просто не потрапляють. */
export function renderConfirmationSms(data: ConfirmationLetterData): string {
  const parts: string[] = ['FADE: запис підтверджено'];
  const when = formatWhen(data.start);
  if (when) parts.push(when);
  const where = [data.locationName, data.locationAddress].filter(Boolean).join(', ');
  if (where) parts.push(where);
  if (data.serviceName) parts.push(data.serviceName);
  return parts.join('\n');
}
