'use client';

// Крок оплати депозиту (T-4619b): крісло тримається рівно до серверного
// `expiresAt`. Коли час минув, оплата зникає, а екран каже, що крісло
// звільнено і кошти не списано; жодного попередження про неявку чи чека тут
// немає. Успішне списання передає керування екрану підтвердженого візиту.
import { Button } from '@fade/ui';
import { formatRemaining } from '../deposit-payment';
import DepositOutcome from './DepositOutcome';
import { useDepositPayment } from './use-deposit-payment';

interface Props {
  bookingId: string;
  amount: number;
  expiresAt: string;
  /** Kept for the booking flow contract; the server deadline is authoritative. */
  serverNow?: string;
  resumeToken?: string;
  onCaptured: () => void;
}

export default function PaymentStep({
  bookingId,
  amount,
  expiresAt,
  serverNow,
  resumeToken,
  onCaptured,
}: Props) {
  const { checking, pay, reconcile, remaining, status } = useDepositPayment({
    bookingId,
    expiresAt,
    ...(serverNow ? { serverNow } : {}),
    ...(resumeToken ? { resumeToken } : {}),
    onCaptured,
  });

  if (status === 'expired' || status === 'failed' || status === 'unknown') {
    return (
      <div data-testid="deposit-payment-step" className="flex flex-col items-center gap-4">
        <DepositOutcome
          kind={status}
          checking={checking}
          onCheck={status === 'unknown' ? () => void reconcile() : undefined}
        />
      </div>
    );
  }

  const paying = status === 'paying';
  return (
    <div
      data-testid="deposit-payment-step"
      className="flex flex-col items-center gap-4 text-center"
    >
      <h2 className="font-display text-h4">Сплатіть депозит</h2>
      <p className="text-fg-secondary">
        Крісло тримаємо ще{' '}
        <strong className="text-fg" data-testid="deposit-countdown">
          {formatRemaining(remaining)}
        </strong>
        . Після цього бронювання звільниться.
      </p>
      <p className="text-fg">Депозит: {amount} ₴</p>
      <Button loading={paying} onClick={() => void pay()}>
        Сплатити депозит {amount} ₴
      </Button>
      <p className="text-sm text-fg-secondary">Кошти списуються лише після успішної оплати.</p>
    </div>
  );
}
