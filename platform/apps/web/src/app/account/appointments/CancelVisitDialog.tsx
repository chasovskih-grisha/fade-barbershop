'use client';

import { AlertBanner, Button, Modal } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { cancelDepositOutcome } from './cancel-consequence';

const DEPOSIT_SENTENCE = {
  returned: 'Депозит повернеться',
  retained: 'Депозит утримується',
} as const;

export function CancelVisitDialog({
  visit,
  open,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  visit: ExtendedAppointment | null;
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  // Діалог лише називає наслідок: гроші рухає T-091, не ця кнопка.
  const outcome = visit ? cancelDepositOutcome(visit, new Date()) : null;
  return (
    <Modal open={open} onClose={onClose} title="Скасувати запис">
      {visit ? (
        <div className="flex flex-col gap-4">
          <p className="text-body text-fg-secondary">
            Ви впевнені, що хочете скасувати запис на{' '}
            <strong>
              {visit.date} о {visit.startTime}
            </strong>
            ?
          </p>
          {outcome ? <p className="text-body">{DEPOSIT_SENTENCE[outcome]}</p> : null}
          {error ? <AlertBanner tone="error" title={error} /> : null}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Залишити запис
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={busy}>
              {busy ? 'Скасування...' : 'Скасувати запис'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
