'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDepositStatus, payDeposit } from '../bookingApi';
import {
  newPaymentRequestKey,
  remainingMs,
  statusAfterPayment,
  type DepositPaymentStatus,
} from '../deposit-payment';

/**
 * Countdown, single-shot capture and read-only reconciliation for a deposit.
 * A lost POST response never triggers a second POST: the status route decides.
 */
export function useDepositPayment(input: {
  bookingId: string;
  expiresAt: string;
  serverNow?: string;
  resumeToken?: string;
  onCaptured: () => void;
}) {
  const { bookingId, expiresAt, serverNow, resumeToken, onCaptured } = input;
  const [requestKey] = useState(() => newPaymentRequestKey());
  const clockOffset = useMemo(() => {
    const server = serverNow ? new Date(serverNow).getTime() : NaN;
    return Number.isNaN(server) ? 0 : server - Date.now();
  }, [serverNow]);
  const now = useCallback(() => Date.now() + clockOffset, [clockOffset]);
  const [remaining, setRemaining] = useState(() => remainingMs(expiresAt, now()));
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<DepositPaymentStatus>(() =>
    remainingMs(expiresAt, now()) > 0 ? 'payable' : 'expired'
  );

  useEffect(() => {
    setRemaining(remainingMs(expiresAt, now()));
    setStatus((current) =>
      current === 'payable' && remainingMs(expiresAt, now()) <= 0 ? 'expired' : current
    );
    const deadline = new Date(expiresAt).getTime();
    if (Number.isNaN(deadline)) return;
    const timer = setInterval(() => {
      const next = remainingMs(expiresAt, now());
      setRemaining(next);
      if (next <= 0) setStatus((current) => (current === 'payable' ? 'expired' : current));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, now]);

  const reconcile = useCallback(async () => {
    setChecking(true);
    try {
      const result = resumeToken
        ? await fetchDepositStatus(bookingId, resumeToken)
        : await fetchDepositStatus(bookingId);
      const next = statusAfterPayment(result.outcome);
      if (next === 'paid') {
        onCaptured();
        return;
      }
      setStatus(next);
    } catch {
      setStatus('unknown');
    } finally {
      setChecking(false);
    }
  }, [bookingId, resumeToken, onCaptured]);

  const pay = useCallback(async () => {
    setStatus('paying');
    try {
      const result = await payDeposit(bookingId, requestKey);
      const next = statusAfterPayment(result.outcome);
      if (next === 'paid') {
        onCaptured();
        return;
      }
      if (next === 'unknown') {
        await reconcile();
        return;
      }
      setStatus(next);
    } catch {
      // The charge may have succeeded with a lost response; reconcile by GET.
      await reconcile();
    }
  }, [bookingId, requestKey, onCaptured, reconcile]);

  return { checking, pay, reconcile, remaining, status };
}
