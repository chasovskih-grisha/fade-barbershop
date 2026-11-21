import Link from 'next/link';
import { BrandLockup } from '../components/shell/BrandLockup';

interface LoginHeaderProps {
  step: 1 | 2;
  displayPhone: string;
}

export function LoginHeader({ step, displayPhone }: LoginHeaderProps) {
  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {step === 1
          ? 'Крок 1 з 2: Введіть номер телефону'
          : `Крок 2 з 2: Введіть код підтвердження з SMS на номер ${displayPhone}`}
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
    </>
  );
}
