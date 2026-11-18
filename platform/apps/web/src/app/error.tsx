'use client';

import { useEffect } from 'react';

export default function WebErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured telemetry logging for unhandled runtime errors in web app
    console.error('[FADE_WEB_ERROR_BOUNDARY]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-fg">
          Щось пішло не так / Something went wrong
        </h2>
        <p className="text-sm text-fg-secondary">
          Виникла неочікувана помилка при завантаженні сторінки. Наша система телеметрії зафіксувала інцидент.
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-interactive-hover transition-colors"
          >
            Спробувати знову / Try again
          </button>
        </div>
      </div>
    </div>
  );
}
