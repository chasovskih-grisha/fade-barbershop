'use client';

// T-4619c: клієнт може повернутися до неоплаченого депозиту з кабінету,
// поки серверне утримання крісла ще активне.
import { useEffect, useState } from 'react';
import { Button, formatMoney } from '@fade/ui';
import { getDepositStatus, payDeposit, type DepositHoldStatus } from '@/app/booking/bookingApi';

type State =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'hold'; hold: DepositHoldStatus }
  | { kind: 'paying'; hold: DepositHoldStatus }
  | { kind: 'message'; text: string };

export function DepositPaymentAction({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const hold = await getDepositStatus(bookingId);
        if (active) setState({ kind: 'hold', hold });
      } catch {
        if (active) setState({ kind: 'unavailable' });
      }
    })();
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (state.kind === 'loading' || state.kind === 'unavailable') return null;

  if (state.kind === 'message') {
    return <p className="text-body-s text-fg-secondary">{state.text}</p>;
  }

  if (state.hold.status === 'paid') {
    return <p className="text-body-s text-success">Депозит сплачено</p>;
  }

  if (state.hold.status === 'expired') {
    return <p className="text-body-s text-fg-secondary">Час на оплату депозиту минув</p>;
  }

  if (state.kind === 'paying') {
    return <p className="text-body-s text-fg-secondary">Списуємо депозит…</p>;
  }

  const { amount } = state.hold;

  async function pay() {
    if (state.kind !== 'hold') return;
    const hold = state.hold;
    setState({ kind: 'paying', hold });
    try {
      const result = await payDeposit(bookingId);
      if (result.outcome === 'captured' || result.outcome === 'already_paid') {
        window.location.reload();
        return;
      }
      setState({
        kind: 'message',
        text:
          result.outcome === 'expired'
            ? 'Час на оплату депозиту минув'
            : 'Кошти не списані. Спробуйте ще раз або оберіть інший час.',
      });
    } catch {
      setState({
        kind: 'message',
        text: 'Не вдалося отримати відповідь банку. Перевірте оплату перед повтором.',
      });
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={pay}>
      Сплатити депозит {formatMoney(amount)}
    </Button>
  );
}
