'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, AlertBanner } from '@fade/ui';
import { useAuth } from '../components/auth/AuthProvider';
import Link from 'next/link';
import { BrandLockup } from '../components/shell/BrandLockup';
import { formatPhone, unformatPhone } from './phoneFormat';
import { PhoneStepForm, CodeStepForm } from './LoginForms';
import { useLoginTimers } from './useLoginTimers';
import { safeNextPath, useLoginActions } from './useLoginActions';

// Next 15 вимагає Suspense-межу навколо useSearchParams: інакше пререндер
// /login падає з «missing-suspense-with-csr-bailout».
function LoginPageContent() {
  const router = useRouter();
  const { login, requestOtp } = useAuth();
  const nextUrl = safeNextPath(useSearchParams().get('next'));
  const [step, setStep] = useState<1 | 2>(1);
  const [rawPhone, setRawPhone] = useState('+380');
  const [displayPhone, setDisplayPhone] = useState('+380');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { resendTimer, setResendTimer } = useLoginTimers(step);
  const stepRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    stepRef.current?.focus();
  }, [step]);

  const actions = useLoginActions({
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
  });

  // displayPhone синхронізується з rawPhone в onPhoneChange; стартові значення
  // однакові ('+380'), тож окремий mount-ефект тут зайвий.
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-20">
      <p role="status" aria-live="polite" className="sr-only">
        {step === 1 ? 'Крок 1 з 2: Введіть номер телефону' : `Крок 2 з 2: Введіть код підтвердження з SMS на номер ${displayPhone}`}
      </p>
      <header className="flex flex-col items-center justify-center gap-2 text-center">
        <Link href="/" className="flex items-center justify-center">
          <BrandLockup />
        </Link>
        <h1 className="font-display text-h4 mt-4">Вхід до кабінету</h1>
        <p className="text-body text-fg-secondary">
          {step === 1
            ? 'Введіть номер телефону для отримання коду'
            : `Код відправлено на ${displayPhone}`}
        </p>
      </header>
      <div tabIndex={-1} ref={stepRef} data-testid="login-step" className="outline-none">
        <Card className="p-6">
          {error ? (
            <AlertBanner tone="error" title="Помилка" className="mb-4" onDismiss={() => setError('')}>
              {error}
            </AlertBanner>
          ) : null}
          {step === 1 ? (
            <PhoneStepForm
              displayPhone={displayPhone}
              loading={loading}
              error={error}
              onPhoneChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setRawPhone(unformatPhone(formatted));
                setDisplayPhone(formatted);
              }}
              onSubmit={actions.submitPhone}
            />
          ) : (
            <CodeStepForm
              code={code}
              loading={loading}
              error={error}
              resendTimer={resendTimer}
              onCodeChange={setCode}
              onSubmit={actions.submitCode}
              onResend={actions.resend}
              onChangeNumber={() => setStep(1)}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
