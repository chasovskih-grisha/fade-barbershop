'use client';

import { useEffect } from 'react';

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured telemetry logging for unhandled runtime errors in admin app
    console.error('[FADE_ADMIN_ERROR_BOUNDARY]', {
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
        <h2 className="text-2xl font-bold">
          Помилка адміністративної панелі / Admin Panel Error
        </h2>
        <p className="text-sm opacity-75">
          Система логування зафіксувала помилку у модулі керування.
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-bold underline transition-colors"
          >
            Оновити сторінку / Reload Panel
          </button>
        </div>
      </div>
    </div>
  );
}
