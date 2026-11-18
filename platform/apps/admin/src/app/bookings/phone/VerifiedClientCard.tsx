'use client';

// Картка верифікованого клієнта над формою візиту (§6.2): імʼя, VIP-знижка й
// лічильник візитів із CRM. Адмін має бачити, кому записує — раніше екран
// показував лише номер. Дані лише для читання: створення візиту від них не
// залежить, тож помилка залишає «порожній» стан із повтором, а не блокує форму.

import { useVerifiedClient } from './useVerifiedClient';

export function VerifiedClientCard({ phone, clientId }: { phone: string; clientId: string }) {
  const { client, state, load } = useVerifiedClient(clientId);

  if (!clientId) return null;

  return (
    <section
      aria-label="Верифікований клієнт"
      className="mb-4 rounded-card border border-line bg-surface-raised p-3"
    >
      {state === 'loading' ? (
        <p className="text-sm text-fg-muted">Профіль клієнта…</p>
      ) : state === 'error' ? (
        <p className="text-sm text-fg-muted">
          Профіль клієнта недоступний — візит створиться без нього.{' '}
          {/* Підпис НЕ «Спробувати ще раз»: на екрані вже є такий самий
              повтор для довідників, і два однакові лейбли незрозумілі —
              скрипторові та голосовим дикторам однаково. */}
          <button type="button" className="underline" onClick={() => void load()}>
            Перезавантажити профіль
          </button>
        </p>
      ) : (
        <>
          <p className="font-medium">{client?.name ?? 'Клієнт без імені'}</p>
          <p className="text-sm text-fg-secondary">
            {phone}
            {client?.vipDiscountPercent != null && (
              <>
                {' '}
                · <span className="font-medium">VIP −{client.vipDiscountPercent}%</span>
              </>
            )}
            <> · Візитів: {client?.loyaltyVisitsCount ?? 0}</>
          </p>
        </>
      )}
    </section>
  );
}
