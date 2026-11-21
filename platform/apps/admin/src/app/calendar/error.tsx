'use client';

import { useEffect } from 'react';

export default function CalendarErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FADE_ADMIN_CALENDAR_ERROR]', {
      message: error.message,
      scope: 'admin_calendar',
      name: error.name,
      digest: error.digest,
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
          📊
        </div>
        <h2 className="text-xl font-bold text-fg">Помилка завантаження календаря</h2>
        <p className="text-sm text-fg-secondary leading-relaxed">
          Не вдалося завантажити дані розкладу або мережевих візитів. Телеметрія зафіксувала збій в
          модулі адміністрування.
        </p>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center rounded-[var(--radius-button)] bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-interactive-hover"
          >
            Повторити спробу / Retry
          </button>
        </div>
      </div>
    </div>
  );
}
