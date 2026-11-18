'use client';

import { Button, Field } from '@fade/ui';
import { isCompleteUaPhone } from './phoneFormat';

export function PhoneStepForm({
  displayPhone,
  loading,
  error,
  onPhoneChange,
  onSubmit,
}: {
  displayPhone: string;
  loading: boolean;
  error: string;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const busyPhone = loading || !isCompleteUaPhone(displayPhone);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="phone" label="Номер телефону" error={error}>
        <input
          id="phone"
          type="tel"
          className="h-11 rounded-input border border-border bg-surface-base px-3 font-text text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          value={displayPhone}
          onChange={onPhoneChange}
          placeholder="+380 (XX) XXX XX XX"
          required
          autoComplete="tel"
          inputMode="tel"
          disabled={loading}
        />
        <p className="mt-1 text-sm text-fg-secondary">Ми надішлемо SMS з кодом підтвердження</p>
      </Field>
      <Button type="submit" loading={loading} className="w-full mt-2" disabled={busyPhone}>
        Отримати код
      </Button>
      <p className="mt-2 text-xs text-fg-secondary text-center max-w-xs mx-auto">
        Уводячи номер, ви погоджуєтесь з політикою конфіденційності. Телефон — ваш логін.
      </p>
    </form>
  );
}

export function CodeStepForm({
  code,
  loading,
  error,
  resendTimer,
  onCodeChange,
  onSubmit,
  onResend,
  onChangeNumber,
}: {
  code: string;
  loading: boolean;
  error: string;
  resendTimer: number;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onChangeNumber: () => void;
}) {
  const resendLocked = loading || resendTimer > 0;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="code" label="Код з SMS" error={error}>
        <input
          id="code"
          type="text"
          className="h-11 rounded-input border border-border bg-surface-base px-3 font-text text-body tracking-[0.2em] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          required
          autoComplete="one-time-code"
          inputMode="numeric"
          disabled={loading}
        />
      </Field>
      <Button type="submit" loading={loading} className="w-full mt-2">
        Увійти
      </Button>
      <div className="flex flex-col gap-2 text-center">
        <Button variant="ghost" className="w-full" onClick={onResend} disabled={resendLocked}>
          {resendTimer > 0 ? `Надіслати ще раз через ${resendTimer} с` : 'Надіслати код повторно'}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onChangeNumber} disabled={loading}>
          Змінити номер
        </Button>
      </div>
      <p className="mt-4 text-xs text-fg-secondary text-center max-w-xs mx-auto">
        Уводячи номер, ви погоджуєтесь з політикою конфіденційності. Телефон — ваш логін.
      </p>
    </form>
  );
}
