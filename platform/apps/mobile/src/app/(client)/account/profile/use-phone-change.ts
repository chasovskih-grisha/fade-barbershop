import { useCallback, useState } from 'react';
import {
  CODE_INVALID_TEXT,
  PHONE_TAKEN_TEXT,
  PhoneChangeError,
  requestPhoneChange,
  toE164,
  verifyPhoneChange,
} from '@/lib/api/phone-change';

export type PhoneChangeStep = 'closed' | 'number' | 'code';

const INVALID_NUMBER_TEXT = 'Введіть номер у форматі +380 XX XXX XX XX';
const FALLBACK_TEXT = 'Не вдалося змінити номер. Спробуйте пізніше.';

function messageOf(error: unknown): string {
  if (!(error instanceof PhoneChangeError)) return FALLBACK_TEXT;
  if (error.code === 'PHONE_TAKEN') return PHONE_TAKEN_TEXT;
  if (error.code === 'OTP_INVALID' || error.code === 'OTP_EXPIRED') return CODE_INVALID_TEXT;
  return error.message;
}

/** Двокроковий флоу зміни номера на профілі застосунку (T-4720c). */
export function usePhoneChange(onSuccess: () => void) {
  const [step, setStep] = useState<PhoneChangeStep>('closed');
  const [phone, setPhoneValue] = useState('');
  const [code, setCodeValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = useCallback(() => {
    setPhoneValue('');
    setCodeValue('');
    setError(null);
    setStep('number');
  }, []);

  const close = useCallback(() => {
    setStep('closed');
    setError(null);
  }, []);

  const setPhone = useCallback((value: string) => {
    setPhoneValue(value);
    setError(null);
  }, []);

  const setCode = useCallback((value: string) => {
    setCodeValue(value.replace(/\D/g, '').slice(0, 6));
    setError(null);
  }, []);

  const submitNumber = useCallback(async () => {
    const e164 = toE164(phone);
    if (!e164) {
      setError(INVALID_NUMBER_TEXT);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestPhoneChange(e164);
      setStep('code');
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }, [phone]);

  const submitCode = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await verifyPhoneChange(toE164(phone), code);
      onSuccess();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }, [phone, code, onSuccess]);

  return {
    step,
    phone,
    code,
    error,
    busy,
    open,
    close,
    setPhone,
    setCode,
    submitNumber,
    submitCode,
  };
}
