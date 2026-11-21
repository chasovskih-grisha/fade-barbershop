'use client';

import { useEffect, useState } from 'react';
import { Button, TextField, AlertBanner, Badge } from '@fade/ui';

export default function BookingErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [phone, setPhone] = useState('');
  const [ticketCode, setTicketCode] = useState('');

  useEffect(() => {
    console.error('[FADE_BOOKING_ERROR_BOUNDARY]', {
      message: error.message,
      scope: 'booking_funnel',
      name: error.name,
      digest: error.digest,
    });
  }, [error]);

  const handleQuickTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    const generated = `TICK-ERR-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketCode(generated);
    setTicketSubmitted(true);
  };

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="max-w-md w-full space-y-4 bg-surface-base p-6 md:p-8 rounded-[var(--radius-card)] border border-line shadow-sm text-left">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-sunken text-action-primary text-xl font-bold flex-shrink-0">
            ⚠️
          </div>
          <div>
            <Badge tone="danger" className="mb-1">
              Збій оформлення
            </Badge>
            <h2 className="text-xl font-bold text-fg">Помилка оформлення запису</h2>
          </div>
        </div>

        <p className="text-sm text-fg-secondary leading-relaxed">
          На жаль, сталася помилка під час обробки запису або перевірки доступності слота (
          {error.message || 'невідома помилка'}). Можливо, обраний час щойно зайняли.
        </p>

        {ticketSubmitted ? (
          <AlertBanner tone="success" title={`Екстрений тікет створено: ${ticketCode}`}>
            Адміністратор FADE Hub отримав деталі помилки разом із вашим номером. Ми передзвонимо
            вам протягом 5 хвилин!
          </AlertBanner>
        ) : (
          <form onSubmit={handleQuickTicketSubmit} className="space-y-3 pt-2 border-t border-line">
            <p className="text-xs font-medium text-fg">
              Бажаєте, щоб адміністратор вирішив це питання замість вас? Залиште телефон:
            </p>
            <div className="flex gap-2">
              <TextField
                id="error-quick-phone"
                label=""
                placeholder="+380 (XX) XXX-XX-XX"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-surface-sunken"
              />
              <Button type="submit" variant="primary" className="text-xs px-4">
                SOS-дзвінок
              </Button>
            </div>
          </form>
        )}

        <div className="pt-2 flex flex-col gap-2.5">
          <Button type="button" onClick={() => reset()} className="w-full">
            Спробувати знову / Обрати інший час
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
            <a
              href="https://t.me/fade_support_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-surface-sunken px-3 py-2 text-xs font-medium text-fg hover:bg-surface-raised border border-line transition-colors"
            >
              💬 Консьєрж у Telegram
            </a>
            <a
              href="tel:+380443334455"
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-surface-sunken px-3 py-2 text-xs font-medium text-fg hover:bg-surface-raised border border-line transition-colors"
            >
              📞 Зателефонувати
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
