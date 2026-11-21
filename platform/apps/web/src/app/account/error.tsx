'use client';

import { useEffect } from 'react';

export default function AccountErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FADE_ACCOUNT_ERROR_BOUNDARY]', {
      message: error.message,
      scope: 'client_account',
      name: error.name,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="max-w-md space-y-4 bg-surface-base p-6 rounded-[var(--radius-card)] border border-line shadow-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-sunken text-action-primary text-xl font-bold mb-1">
          🔐
        </div>
        <h2 className="text-xl font-bold text-fg">Помилка кабінету клієнта</h2>
        <p className="text-sm text-fg-secondary leading-relaxed">
          Не вдалося завантажити дані облікового запису або налаштування профілю. Будь ласка,
          спробуйте оновити сторінку або увійти знову.
        </p>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center rounded-[var(--radius-button)] bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-interactive-hover"
          >
            Спробувати знову / Try again
          </button>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-surface-sunken px-3 py-2 text-xs font-medium text-fg hover:bg-surface-raised border border-line transition-colors"
            >
              🔑 Повторний вхід
            </a>
            <a
              href="https://t.me/fade_support_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-surface-sunken px-3 py-2 text-xs font-medium text-fg hover:bg-surface-raised border border-line transition-colors"
            >
              💬 Підтримка
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
