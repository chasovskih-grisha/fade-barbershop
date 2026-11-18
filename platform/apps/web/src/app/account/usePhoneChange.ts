'use client';

import { useCallback, useState } from 'react';
import { PhoneChangeError, requestPhoneChange, verifyPhoneChange } from '@/lib/api/phone-change';
import { formatPhone, isCompleteUaPhone, toE164 } from '../login/phoneFormat';

export const PHONE_TAKEN_TEXT = 'Цей номер уже використовується. Введіть інший.';
export const CODE_INVALID_TEXT = 'Невірний код. Спробуйте ще раз.';

export type PhoneChangeStep = 'closed' | 'number' | 'code';

export interface PhoneChange {
  step: PhoneChangeStep;
  phone: string;
  code: string;
  error: string | null;
  busy: boolean;
  open: () => void;
  close: () => void;
  setPhone: (value: string) => void;
  setCode: (value: string) => void;
  submitNumber: (e: React.FormEvent) => Promise<void>;
  submitCode: (e: React.FormEvent) => Promise<void>;
}

function messageOf(error: unknown): string {
  if (!(error instanceof PhoneChangeError)) return 'Не вдалося змінити номер. Спробуйте пізніше.';
  if (error.code === 'PHONE_TAKEN') return PHONE_TAKEN_TEXT;
  if (error.code === 'OTP_INVALID' || error.code === 'OTP_EXPIRED') return CODE_INVALID_TEXT;
  return error.message;
}

/**
 * Флоу зміни номера на картці акаунта (T-4720b). Викликає наявний use case
 * T-4620a; на успіх віддає керування `onSuccess` (вихід із сесії → /login).
 * Невірний код лишається на кроці коду.
 */
export function usePhoneChange(onSuccess: () => void): PhoneChange {
  const [step, setStep] = useState<PhoneChangeStep>('closed');
  const [phone, setPhoneValue] = useState('+380');
  const [code, setCodeValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = useCallback(() => {
    setPhoneValue('+380');
    setCodeValue('');
    setError(null);
    setStep('number');
  }, []);

  const close = useCallback(() => {
    setStep('closed');
    setError(null);
  }, []);

  const setPhone = useCallback((value: string) => {
    setPhoneValue(formatPhone(value));
    setError(null);
  }, []);

  const setCode = useCallback((value: string) => {
    setCodeValue(value.replace(/\D/g, '').slice(0, 6));
    setError(null);
  }, []);

  const submitNumber = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isCompleteUaPhone(phone)) {
        setError('Введіть номер у форматі +380 XX XXX XX XX');
        return;
      }
      setError(null);
      setBusy(true);
      try {
        await requestPhoneChange(toE164(phone));
        setStep('code');
      } catch (cause) {
        setError(messageOf(cause));
      } finally {
        setBusy(false);
      }
    },
    [phone]
  );

  const submitCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
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
    },
    [phone, code, onSuccess]
  );

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
