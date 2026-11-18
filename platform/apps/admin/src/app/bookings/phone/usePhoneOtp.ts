'use client';

// Хук OTP для телефонного запису (T-4409 UI): POST /admin/clients/otp/request
// і /verify; busy + помилки за кодами домену (401 обробляє глобальний guard).
//
// verify віддає clientId (User.id) разом із телефоном: без нього наступний крок
// створював би візит з clientId=null (T-046). Це саме той id, який «Мої візити»
// читають, тож id профілю клієнта сюди не підставляється.
import { useState } from 'react';

const MESSAGE_BY_CODE: Record<string, string> = {
  INVALID_PHONE: 'Невірний номер — потрібен +380…',
  OTP_RESEND_TOO_SOON: 'Занадто часто — зачекайте перед повтором',
  OTP_CHALLENGE_NOT_FOUND: 'Код не запитували — спочатку «Надіслати код»',
  OTP_EXPIRED: 'Код протермінувався — надішліть новий',
  OTP_INVALID: 'Невірний код',
  OTP_LOCKED: 'Забагато спроб — повторіть пізніше',
  USER_NOT_FOUND: 'Клієнта з таким номером ще не існує (потрібен перший вхід)',
  CLIENT_ID_MISSING: 'Сервер не повернув клієнта — візит створиться без привʼязки',
};

function messageFor(status: number, body: { code?: string }): string {
  const code = body?.code ?? '';
  const byCode = MESSAGE_BY_CODE[code];
  if (byCode) return byCode;
  if (status === 429) return 'Занадто часто — зачекайте перед повтором';
  return 'Не вдалося виконати дію';
}

export interface OtpVerifyResult {
  phoneVerifiedAt: string;
  clientId: string;
}

export function usePhoneOtp() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /** null = невдача (помилка вже в стані). Інакше — розпарсений JSON відповіді. */
  const call = async (path: 'request' | 'verify', body: object): Promise<object | null> => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/admin/clients/otp/${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) return (await response.json().catch(() => null)) as object | null;
      setError(
        messageFor(response.status, (await response.json().catch(() => ({}))) as { code?: string })
      );
      return null;
    } catch {
      // Обрив мережі/сервера: інакше помилка тікає з async-обробника як
      // unhandled rejection, а форма лишається в busy назавжди.
      setError('Не вдалося виконати дію');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const verify = async (phone: string, code: string): Promise<OtpVerifyResult | null> => {
    const body = await call('verify', { phone, code });
    const clientId = (body as Partial<OtpVerifyResult> | null)?.clientId;
    // Успішна верифікація без clientId — порушення контракту. Краще показати
    // помилку тут, ніж створити візит без привʼязки до клієнта мовчки.
    if (body && !clientId) {
      setError(MESSAGE_BY_CODE.CLIENT_ID_MISSING ?? 'Не вдалося виконати дію');
      return null;
    }
    return body as OtpVerifyResult | null;
  };

  return {
    busy,
    error,
    setError,
    request: async (phone: string) => (await call('request', { phone })) !== null,
    verify,
  };
}
