'use client';

import { useEffect } from 'react';

export default function BarbersErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured telemetry logging for barbers module runtime error
    console.error('[FADE_BARBERS_ERROR_BOUNDARY]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-container flex-col items-center justify-center p-16 text-center min-h-[50vh]">
      <div className="max-w-md space-y-4 bg-surface-sunken p-8 rounded-card border border-line shadow-lg">
        <h2 className="text-h3 font-display font-bold text-fg">
          Помилка завантаження майстрів / Barbers Load Error
        </h2>
        <p className="text-body text-fg-secondary">
          Не вдалося завантажити список майстрів. Наша система телеметрії зафіксувала помилку.
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-interactive-hover transition-colors shadow-md"
          >
            Спробувати знову / Try again
          </button>
        </div>
      </div>
    </div>
  );
}
