'use client';

// Дія «Записатися знову» на завершеному візиті (T-4617b). Запитує намір
// (T-4617a), будує посилання у наявний флоу запису і показує, що змінилося.
// Майбутній візит кнопки не має — там уже є перенос.

import { useState } from 'react';
import { Button } from '@fade/ui';
import { getBookAgainIntent } from '@/lib/api/appointments';
import { bookAgainHref, bookAgainNotice } from './book-again';

// Перехід у флоу запису: повне завантаження /booking, щоб флоу прочитав
// query-параметри передзаповнення при монтуванні. Кнопка не рендерить
// роутер, тож картка не залежить від app-router контексту.
function defaultNavigate(href: string) {
  if (typeof window !== 'undefined') window.location.assign(href);
}

export function BookAgainButton({
  appointmentId,
  navigate = defaultNavigate,
}: {
  appointmentId: string;
  /** Для тестів; за замовчуванням — перехід на /booking. */
  navigate?: (href: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [notice, setNotice] = useState<string | null>(null);

  const start = async () => {
    setStatus('loading');
    setNotice(null);
    try {
      const intent = await getBookAgainIntent(appointmentId);
      const message = bookAgainNotice(intent);
      if (message) setNotice(message);
      navigate(bookAgainHref(intent));
    } catch {
      setStatus('error');
      setNotice('Не вдалося почати повторний запис — спробуйте пізніше');
      return;
    }
    setStatus('idle');
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <Button
        variant="secondary"
        size="md"
        className="w-fit"
        onClick={() => void start()}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Готуємо…' : 'Записатися знову'}
      </Button>
      {notice && (
        <p role="alert" className="text-body-s text-fg-muted">
          {notice}
        </p>
      )}
    </div>
  );
}
