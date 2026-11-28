'use client';

import { Button } from '@fade/ui';
import { VisitPayDialog } from './VisitPayDialog';
import { DayMoneySummary } from './DayMoneySummary';
import { ActiveVisitCard, PastVisitCard, VisitsSkeleton } from './barber-visit-cards';
import { useBarberVisits, useOnsitePayment } from './use-barber-visits';

export default function BarberPage() {
  const { user, visits, loading, error, reload } = useBarberVisits();
  const { payingId, payOpen, payBusy, openPay, closePay, onPay } = useOnsitePayment(reload);

  if (!user) return null;

  const active = visits.filter((v) => v.status !== 'completed' && v.status !== 'cancelled');
  const past = visits.filter((v) => v.status === 'completed' || v.status === 'cancelled');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-h3">Мої візити</h1>
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            window.location.href = '/account';
          }}
        >
          Назад до профілю
        </Button>
      </header>

      <p className="text-body text-fg-secondary">
        Оплату на місці ви позначаєте для walk-in візитів — після послуги. Решту онлайн-візиту
        позначає адміністратор.
      </p>

      <DayMoneySummary />

      {error ? (
        <p className="text-body text-semantic-danger">{error}</p>
      ) : loading ? (
        <VisitsSkeleton />
      ) : active.length === 0 ? (
        <p className="text-body text-fg-secondary">Сьогодні немає візитів.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((visit) => (
            <ActiveVisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-6">
          <h2 className="font-medium text-bodyLg mb-3">Позатижневе</h2>
          <div className="flex flex-col gap-3">
            {past.map((visit) => (
              <PastVisitCard key={visit.id} visit={visit} payBusy={payBusy} onPay={openPay} />
            ))}
          </div>
        </div>
      )}

      <VisitPayDialog
        bookingId={payingId ?? ''}
        open={payOpen}
        busy={payBusy}
        onClose={closePay}
        onPay={onPay}
      />
    </div>
  );
}
