'use client';

import { useEffect } from 'react';
import { ActionLink } from '@/app/components/ActionLink';

// T-4864: помилка /barbers і профілю говорить однією мовою — українською, без
// другого підпису через слеш, без «телеметрії» й без сирого тексту помилки.
// Ретрай лишається кнопкою, що перезапускає сегмент.
export default function BarbersErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Знеособлений лог для діагностики: гостеві він не показується.
    console.error('[FADE_BARBERS_ERROR_BOUNDARY]', {
      name: error.name,
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-container flex-col items-center justify-center px-4 py-16 text-center md:py-24">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-card border border-line bg-surface-sunken p-8">
        <h1 className="font-display text-h3 font-semibold text-fg">
          Не вдалося завантажити майстрів
        </h1>
        <p className="text-body text-fg-secondary">
          Спробуйте ще раз — це займе кілька секунд. Якщо не вийде, поверніться на головну.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-12 items-center justify-center rounded-input bg-accent px-5 font-text text-body font-medium text-accent-fg transition-colors hover:bg-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          Спробувати ще раз
        </button>
        <ActionLink href="/" variant="secondary" className="w-full">
          На головну
        </ActionLink>
      </div>
    </div>
  );
}
