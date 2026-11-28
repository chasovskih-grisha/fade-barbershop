import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { uuidv7 } from '@fade/domain-shared';
import {
  fetchDepositStatus,
  payBookingDeposit,
  type CreatedBooking,
  type DepositPayment,
} from '../../../lib/api/booking';

interface DepositSource {
  setError: Dispatch<SetStateAction<string | null>>;
  onPaid: () => void;
}

/** Server deposit state for one created visit. */
export function useDepositPayment({ setError, onPaid }: DepositSource) {
  const [created, setCreated] = useState<CreatedBooking | null>(null);
  const [payment, setPayment] = useState<DepositPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [requestKey, setRequestKey] = useState(() => uuidv7());

  const expiresAt = created?.deposit?.expiresAt ?? null;
  const clockOffset = useMemo(() => {
    const server = created?.deposit ? new Date(created.deposit.serverNow).getTime() : NaN;
    return Number.isNaN(server) ? 0 : server - Date.now();
  }, [created]);
  const liveRemaining = expiresAt
    ? Math.max(0, new Date(expiresAt).getTime() - (Date.now() + clockOffset))
    : 0;

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - (Date.now() + clockOffset)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [clockOffset, expiresAt]);

  const start = useCallback((booking: CreatedBooking) => {
    setCreated(booking);
    setPayment(null);
    setRemaining(0);
    setRequestKey(uuidv7());
  }, []);

  const reset = useCallback(() => {
    setCreated(null);
    setPayment(null);
    setRemaining(0);
  }, []);

  const pay = useCallback(async () => {
    if (!created) return;
    setLoading(true);
    setError(null);
    try {
      const result = await payBookingDeposit(created.id, requestKey);
      applyPayment({ result, setPayment, setError, onPaid });
    } catch {
      try {
        const status = await fetchDepositStatus(created.id, created.deposit?.resumeToken);
        applyPayment({ result: status, setPayment, setError, onPaid });
      } catch {
        setError('Невідомий результат оплати. Перевірте списання перед повтором.');
      }
    } finally {
      setLoading(false);
    }
  }, [created, onPaid, requestKey, setError]);

  return {
    created,
    payment,
    loading,
    remaining: Math.max(remaining, liveRemaining),
    start,
    reset,
    pay,
  };
}

interface PaymentResult {
  result: DepositPayment;
  setPayment: (value: DepositPayment) => void;
  setError: (value: string | null) => void;
  onPaid: () => void;
}

function applyPayment({ result, setPayment, setError, onPaid }: PaymentResult): void {
  setPayment(result);
  if (result.outcome === 'captured' || result.outcome === 'already_paid') onPaid();
  else if (result.outcome === 'expired') setError('Час на оплату депозиту минув');
  else if (result.outcome === 'failed') {
    setError('Кошти не списані. Спробуйте ще раз або оберіть інший час.');
  } else setError('Невідомий результат оплати. Перевірте списання перед повтором.');
}
