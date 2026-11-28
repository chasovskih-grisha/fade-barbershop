'use client';

// T-093: on-site payment on the visit card. The remainder is server-computed
// (`FinalPrice − captured deposit`) and never editable; the actor comes from the
// admin session on the API, not from this form.
import { useCallback, useEffect, useState } from 'react';
import { Card } from '@fade/ui';
import { OnsitePaymentDetails } from './OnsitePaymentDetails';
import { OnsitePaymentTotals } from './OnsitePaymentTotals';
import type { OnsiteForm, OnsiteStatus } from './onsite-payment-types';

export function OnsitePaymentCard({
  bookingId,
  status: bookingStatus,
}: {
  bookingId: string;
  /** Booking lifecycle status; cancelled/no-show visits have nothing to collect. */
  status?: string;
}) {
  const hidden = bookingStatus === 'cancelled' || bookingStatus === 'no_show';
  const [status, setStatus] = useState<OnsiteStatus | null>(null);
  const [form, setForm] = useState<OnsiteForm>('cash');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (hidden) return;
    const res = await fetch(`/admin/payments/bookings/${bookingId}/onsite`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Не вдалося завантажити стан оплати');
    const data = (await res.json()) as OnsiteStatus;
    setStatus(typeof data.finalPrice === 'number' ? data : null);
  }, [bookingId, hidden]);

  useEffect(() => {
    load().catch((cause) =>
      setError(cause instanceof Error ? cause.message : 'Помилка завантаження оплати')
    );
  }, [load]);

  const run = async (path: string, body?: object) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = (await res.json()) as { outcome?: string; failureReason?: string };
      if (!res.ok) throw new Error(data.failureReason ?? 'Не вдалося виконати оплату');
      await load();
      setMessage(
        data.outcome === 'already_paid'
          ? 'Решту вже позначено раніше — повторного списання немає.'
          : 'Оплату на місці зафіксовано.'
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Помилка оплати');
    } finally {
      setBusy(false);
    }
  };

  if (hidden) return null;
  if (!status) {
    return error ? (
      <Card className="p-6 lg:col-span-2">
        <p role="alert" className="text-body text-semantic-danger">
          {error}
        </p>
      </Card>
    ) : null;
  }

  return (
    <Card className="p-6 lg:col-span-2">
      <h2 className="mb-3 font-display text-h4">Оплата на місці</h2>
      <OnsitePaymentTotals status={status} />
      <OnsitePaymentDetails
        status={status}
        form={form}
        busy={busy}
        onForm={setForm}
        onPay={() => void run('/admin/payments/onsite', { bookingId, form })}
        onRetry={() => void run(`/admin/payments/bookings/${bookingId}/onsite/receipt/retry`)}
      />
      {message ? <p className="mt-3 text-body text-semantic-success">{message}</p> : null}
      {error ? (
        <p role="alert" className="mt-3 text-body text-semantic-danger">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
