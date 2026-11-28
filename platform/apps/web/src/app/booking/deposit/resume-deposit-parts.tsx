import type { ReactNode } from 'react';
import Link from 'next/link';

export function ResumeShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 p-4 text-center md:py-10">
      {children}
    </div>
  );
}

export function ResumeActions({ checking, onRetry }: { checking: boolean; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" className={PRIMARY} onClick={onRetry} disabled={checking}>
        {checking ? 'Перевіряємо…' : 'Спробувати ще раз'}
      </button>
      <Link href="/account/appointments" className={SECONDARY}>
        Мої візити
      </Link>
    </div>
  );
}

export const PRIMARY =
  'inline-flex h-11 items-center justify-center rounded-input bg-accent px-4 font-text font-medium text-accent-fg transition-colors duration-150 hover:bg-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 disabled:opacity-60';
export const SECONDARY =
  'inline-flex h-11 items-center justify-center rounded-input bg-interactive px-4 font-text font-medium text-fg transition-colors duration-150 hover:bg-interactive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2';
