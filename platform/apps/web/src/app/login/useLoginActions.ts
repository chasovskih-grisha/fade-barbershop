'use client';

import { useCallback } from 'react';
import { isCompleteUaPhone, toE164 } from './phoneFormat';

/** Лише внутрішній шлях. Інакше ?next=https://… виводить сесію на чужий сайт. */
export function safeNextPath(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) {
    return value;
  }
  return '/account/appointments';
}

export function useLoginActions({
  rawPhone,
  code,
  nextUrl,
  resendTimer,
  login,
  requestOtp,
  router,
  setStep,
  setResendTimer,
  setLoading,
  setError,
}: {
  rawPhone: string;
  code: string;
  nextUrl: string;
  resendTimer: number;
  login: (phone: string, code: string) => Promise<unknown>;
  requestOtp: (phone: string) => Promise<unknown>;
  router: { push: (url: string) => void; refresh: () => void };
  setStep: (step: 1 | 2) => void;
  setResendTimer: (n: number) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string) => void;
}) {
  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isCompleteUaPhone(rawPhone)) {
      setError('Введіть номер у форматі +380 XX XXX XX XX');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(toE164(rawPhone));
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не вдалося відправити SMS. Спробуйте пізніше.'
      );
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(toE164(rawPhone), code);
      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невірний код.');
    } finally {
      setLoading(false);
    }
  };

  const resend = useCallback(() => {
    if (resendTimer > 0) return;
    setLoading(true);
    requestOtp(toE164(rawPhone))
      .then(() => setResendTimer(60))
      .catch(() => setError('Не вдалося відправити код повторно.'))
      .finally(() => setLoading(false));
  }, [rawPhone, resendTimer, requestOtp, setResendTimer, setLoading, setError]);

  return { submitPhone, submitCode, resend };
}
