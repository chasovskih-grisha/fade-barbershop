'use client';

import { formatMoney } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { ActionLink } from '@/app/components/ActionLink';
import { depositHoldNote, depositResumeHref, refundNote } from './deposit-summary';

export function DepositPanel({ app }: { app: ExtendedAppointment }) {
  const deposit = app.deposit;
  const now = new Date();

  if (!deposit || deposit.amount <= 0) return null;

  const note = depositHoldNote(app, now);
  const resumeHref = depositResumeHref(app, now);
  const refund = refundNote(app);

  return (
    <div className="border-t border-border/60 pt-3 flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-body-s text-fg-secondary">Депозит</span>
        <span className="font-medium text-fg tabular-nums">{formatMoney(deposit.amount)}</span>
      </div>
      {refund != null && <p className="text-body-s text-fg-secondary">{refund}</p>}
      {note != null && (
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-body-s text-fg-secondary">{note}</p>
          {resumeHref && (
            <ActionLink href={resumeHref} className="h-10 px-4 text-body">
              Оплатити депозит
            </ActionLink>
          )}
        </div>
      )}
    </div>
  );
}
