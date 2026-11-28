import { apiBase } from './api-base';

// Зміна номера клієнта (T-4720c): той самий use case, що на сайті (T-4620a).
// Обидва кроки несуть cookie-сесію, код має призначення phone_change.

export const PHONE_TAKEN_TEXT = 'Цей номер уже використовується. Введіть інший.';
export const CODE_INVALID_TEXT = 'Невірний код. Спробуйте ще раз.';
export const OFFLINE_TEXT = 'Немає з’єднання. Перевірте мережу й спробуйте ще раз.';

export class PhoneChangeError extends Error {
  constructor(
    message: string,
    /** Код помилки API (напр. PHONE_TAKEN, OTP_INVALID); немає — мережа/невідоме. */
    readonly code: string | null = null
  ) {
    super(message);
    this.name = 'PhoneChangeError';
  }
}

async function post(path: string, body: unknown): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new PhoneChangeError(OFFLINE_TEXT);
  }
  if (res.ok) return;
  const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  throw new PhoneChangeError(data.message || `API ${res.status}`, data.code ?? null);
}

/** Крок 1: код на новий номер. `phone` — E.164 (`+380…`). */
export async function requestPhoneChange(phone: string): Promise<void> {
  await post('/identity/phone/change/request', { phone });
}

/** Крок 2: код з нового номера переносить номер на того самого користувача. */
export async function verifyPhoneChange(phone: string, code: string): Promise<void> {
  await post('/identity/phone/change/verify', { phone, code });
}

/** Лишає цифри й провідний «+»; порожній рядок — некоректний номер. */
export function toE164(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('380') ? `+${digits}` : '';
}
