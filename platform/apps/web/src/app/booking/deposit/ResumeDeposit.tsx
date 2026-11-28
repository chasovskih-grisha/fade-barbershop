'use client';

// Resume a deposit after the tab was closed. The server owns the hold: this
// component re-reads status and deadline before offering payment, so an expired
// hold shows the released state instead of a stale pay button.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDepositStatus, type DepositPayment } from '../bookingApi';
import { ResumeDepositOutcome } from './ResumeDepositOutcome';
import { PRIMARY, ResumeActions, ResumeShell } from './resume-deposit-parts';

type ResumeState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'paid' }
  | { status: 'ready'; deposit: DepositPayment };

export function ResumeDeposit({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<ResumeState>({ status: 'loading' });
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) {
      setState({ status: 'error' });
      return;
    }
    setChecking(true);
    try {
      const deposit = await fetchDepositStatus(bookingId);
      setState(
        deposit.outcome === 'captured' || deposit.outcome === 'already_paid'
          ? { status: 'paid' }
          : { status: 'ready', deposit }
      );
    } catch {
      setState({ status: 'error' });
    } finally {
      setChecking(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') {
    return (
      <ResumeShell>
        <p role="status" className="text-fg-secondary">
          Перевіряємо стан депозиту…
        </p>
      </ResumeShell>
    );
  }

  if (state.status === 'error') {
    return (
      <ResumeShell>
        <h1 className="font-display text-h4">Не вдалося відкрити оплату</h1>
        <p className="text-fg-secondary">
          Ми не отримали стан утримання. Спробуйте ще раз або перегляньте візит у кабінеті.
        </p>
        <ResumeActions checking={checking} onRetry={() => void load()} />
      </ResumeShell>
    );
  }

  if (state.status === 'paid') {
    return (
      <ResumeShell>
        <h1 className="font-display text-h4">Депозит уже сплачено</h1>
        <p className="text-fg-secondary">Візит підтверджено, повторна оплата не потрібна.</p>
        <Link href="/account/appointments" className={PRIMARY}>
          Мої візити
        </Link>
      </ResumeShell>
    );
  }

  return (
    <ResumeDepositOutcome
      bookingId={bookingId}
      deposit={state.deposit}
      checking={checking}
      onRetry={() => void load()}
      onCaptured={() => setState({ status: 'paid' })}
    />
  );
}
