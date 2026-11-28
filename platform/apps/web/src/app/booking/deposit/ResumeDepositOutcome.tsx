import Link from 'next/link';
import type { DepositPayment } from '../bookingApi';
import PaymentStep from '../steps/PaymentStep';
import DepositOutcome from '../steps/DepositOutcome';
import { PRIMARY, ResumeActions, ResumeShell, SECONDARY } from './resume-deposit-parts';

export function ResumeDepositOutcome({
  bookingId,
  deposit,
  checking,
  onRetry,
  onCaptured,
}: {
  bookingId: string;
  deposit: DepositPayment;
  checking: boolean;
  onRetry: () => void;
  onCaptured: () => void;
}) {
  if (deposit.outcome === 'pending' && deposit.expiresAt) {
    return (
      <ResumeShell>
        <h1 className="font-display text-h4">Оплата депозиту</h1>
        <PaymentStep
          bookingId={bookingId}
          amount={deposit.depositAmount}
          expiresAt={deposit.expiresAt}
          onCaptured={onCaptured}
        />
      </ResumeShell>
    );
  }

  if (deposit.outcome === 'pending') {
    return (
      <ResumeShell>
        <h1 className="font-display text-h4">Не вдалося отримати дедлайн</h1>
        <p className="text-fg-secondary">
          Без серверного часу утримання ми не пропонуємо оплату, щоб не взяти гроші за звільнене
          крісло.
        </p>
        <ResumeActions checking={checking} onRetry={onRetry} />
      </ResumeShell>
    );
  }

  if (deposit.outcome === 'expired' || deposit.outcome === 'failed') {
    return (
      <ResumeShell>
        <DepositOutcome kind={deposit.outcome} />
        <Link href="/account/appointments" className={SECONDARY}>
          Мої візити
        </Link>
      </ResumeShell>
    );
  }

  return (
    <ResumeShell>
      <h1 className="font-display text-h4">Депозит не потрібен</h1>
      <p className="text-fg-secondary">Для цього візиту немає незавершеної оплати депозиту.</p>
      <Link href="/account/appointments" className={PRIMARY}>
        Мої візити
      </Link>
    </ResumeShell>
  );
}
