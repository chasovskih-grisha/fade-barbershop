// OTP із Mailpit (T-4301 «SMSPitt»): код приходить email-ом на <номер>@sms.dev
// з subject «Fade — код для запису по телефону» (purpose 'booking', T-4409) і
// тілом «Код для запису по телефону: 123456».

import { MAILPIT_URL } from './admin-env';

const BOOKING_SUBJECT = 'код для запису по телефону';
const CODE_RE = /(\d{4,6})/;

interface Summary {
  ID: string;
  Subject?: string;
  Created?: string;
  To?: Array<{ Address?: string }>;
}
interface Detail {
  Text?: string;
}

/**
 * Національний номер без '+380' і без '0', щоб '0501112233' у сіду і
 * '+380501112233' у полі форми збігалися.
 */
function nationalNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('380') ? digits.slice(3) : digits.replace(/^0/, '');
}

async function listBookingMessages(phone: string): Promise<Summary[]> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=50`);
  if (!res.ok) throw new Error(`Mailpit list: HTTP ${res.status}`);
  const { messages } = (await res.json()) as { messages?: Summary[] };
  const wanted = nationalNumber(phone);
  return (
    (messages ?? [])
      .filter((m) => (m.Subject ?? '').includes(BOOKING_SUBJECT))
      .filter((m) =>
        (m.To ?? []).some((t) => nationalNumber((t.Address ?? '').split('@')[0] ?? '') === wanted)
      )
      // Найновіше першим.
      .sort((a, b) => (b.Created ?? '').localeCompare(a.Created ?? ''))
  );
}

async function readText(id: string): Promise<string> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  if (!res.ok) throw new Error(`Mailpit message ${id}: HTTP ${res.status}`);
  return ((await res.json()) as Detail).Text ?? '';
}

/**
 * Id повідомлень, які є **до** натискання «Надіслати код». Mailpit персистентний,
 * тож без цього знімка тест читає код попереднього прогону: він і є «найновішим»
 * у потоці, поки новий ще не доставлено — і verify відповідає OTP_INVALID.
 */
export async function snapshotBookingOtpIds(phone: string): Promise<string[]> {
  try {
    return (await listBookingMessages(phone)).map((m) => m.ID);
  } catch {
    return []; // Mailpit ще не піднято — не робимо тест залежним від порядку
  }
}

/** Чекає й повертає цифри OTP, зʼявлені після знімка. */
export async function waitForBookingOtp(
  phone: string,
  options: { after?: string[]; timeoutMs?: number } = {}
): Promise<string> {
  const { after = [], timeoutMs = 20_000 } = options;
  const seen = new Set(after);
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      for (const message of await listBookingMessages(phone)) {
        if (seen.has(message.ID)) continue;
        const code = (await readText(message.ID)).match(CODE_RE)?.[1];
        if (code) return code;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `OTP для ${phone} не зʼявився у Mailpit (${MAILPIT_URL}) за ${timeoutMs}ms` +
      (lastError ? `; остання помилка: ${lastError}` : '') +
      '. Перевір, що контейнер smspit запущено і OTP_PROVIDER=mailpit.'
  );
}
