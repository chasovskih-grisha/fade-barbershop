'use client';

import { useEffect } from 'react';

export default function ServicesErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured telemetry logging for services catalog error boundary
    console.error('[FADE_SERVICES_ERROR_BOUNDARY]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      scope: 'services_catalog',
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="max-w-md space-y-4 bg-surface-base p-6 rounded-[var(--radius-card)] border border-line shadow-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-sunken text-action-primary text-xl font-bold mb-1">
          ✂️
        </div>
        <h2 className="text-xl font-bold text-fg">Помилка завантаження каталогів послуг</h2>
        <p className="text-sm text-fg-secondary leading-relaxed">
          На жаль, не вдалося завантажити прайс-лист та актуальні послуги FADE. Наша служба
          моніторингу вже сповіщена про інцидент.
        </p>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center rounded-[var(--radius-button)] bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-interactive-hover"
          >
            Оновити сторінку / Refresh
          </button>

          <a
            href="/"
            className="w-full inline-flex items-center justify-center rounded-[var(--radius-button)] bg-surface-sunken px-3 py-2 text-xs font-medium text-fg hover:bg-surface-raised border border-line transition-colors"
          >
            &larr; На головну
          </a>
        </div>
      </div>
    </div>
  );
}
