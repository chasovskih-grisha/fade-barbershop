import { apiBase } from './api-base';

// Заміна номера клієнта (T-4720b). Обидва кроки несуть cookie-сесію
// (credentials: include) — next-rewrite проксіює /identity/* на API, тому
// окремий BFF-роут не потрібен. Це той самий use case, що T-4620a: OTP
// призначення phone_change, не логін-код.

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

async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new PhoneChangeError('Немає з’єднання. Перевірте мережу й спробуйте ще раз.');
  }
  const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  if (!res.ok) {
    throw new PhoneChangeError(data.message || `API ${res.status}`, data.code ?? null);
  }
  return data;
}

/** Крок 1: код на новий номер. `phone` — E.164 (`+380…`). */
export async function requestPhoneChange(phone: string): Promise<void> {
  await post('/identity/phone/change/request', { phone });
}

/** Крок 2: код з нового номера переносить номер на того самого користувача. */
export async function verifyPhoneChange(phone: string, code: string): Promise<void> {
  await post('/identity/phone/change/verify', { phone, code });
}
