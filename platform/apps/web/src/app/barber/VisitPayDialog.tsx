'use client';

import { useEffect, useState } from 'react';
import { Button, Modal } from '@fade/ui';
import { formatMoney } from '@fade/ui';
import type { BarberOnsiteForm } from '@/lib/api/barber-onsite';
import { getBarberOnsiteStatus, type BarberOnsiteStatus } from '@/lib/api/barber-onsite';
import { PayFormPicker } from './PayFormPicker';

// Вузький шлях барбера: сума до сплати свого завершеного walk-in і форма
// (готівка/POS). Депозит, фінальна ціна, чек і його повтор — адмінська картка
// оплати, тож тут їх не малюємо (PAY-ONS-03/05, barber-screens §1.3).
interface VisitPayDialogProps {
  bookingId: string;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onPay: (form: BarberOnsiteForm) => Promise<void>;
}

type Phase = 'payable' | 'captured' | 'free';

const TITLES: Record<Phase, string> = {
  payable: 'Оплата на місці',
  captured: 'Вже оплачено',
  free: 'Без оплати',
};

const NOTES: Record<Phase, string> = {
  payable: '',
  captured: 'Цей візит уже позначено оплаченим.',
  free: 'Додаткова оплата не потрібна.',
};

function phaseOf(status: BarberOnsiteStatus): Phase {
  if (status.paymentStatus === 'captured') return 'captured';
  if (status.paymentStatus === 'nothing_due' || status.paymentStatus === 'complimentary') {
    return 'free';
  }
  return 'payable';
}

export function VisitPayDialog({ bookingId, open, busy, onClose, onPay }: VisitPayDialogProps) {
  const [status, setStatus] = useState<BarberOnsiteStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BarberOnsiteForm>('cash');

  const loadStatus = async () => {
    setError(null);
    try {
      setStatus(await getBarberOnsiteStatus(bookingId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося завантажити статус');
      setStatus(null);
    }
  };

  useEffect(() => {
    setForm('cash');
    if (open) void loadStatus();
  }, [open, bookingId]);

  const onConfirm = async () => {
    setError(null);
    try {
      await onPay(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося позначити оплату');
    }
  };

  const phase = status ? phaseOf(status) : null;

  return (
    <Modal open={open} onClose={onClose} title={phase ? TITLES[phase] : TITLES.payable}>
      {error ? (
        <p className="text-body text-semantic-danger">{error}</p>
      ) : status && phase ? (
        <>
          <dl className="flex flex-col gap-2 text-body">
            <div className="flex justify-between">
              <dt className="text-fg-secondary">Сума до сплати</dt>
              <dd className="font-medium tabular-nums">{formatMoney(status.amountDue)}</dd>
            </div>
          </dl>

          {phase === 'payable' ? (
            <>
              <PayFormPicker form={form} disabled={busy} onChange={setForm} />
              <div className="flex flex-col gap-2 mt-4">
                <Button variant="primary" size="md" onClick={onConfirm} disabled={busy}>
                  Позначити оплату
                </Button>
              </div>
            </>
          ) : (
            <p className="text-body text-fg-secondary mt-2">{NOTES[phase]}</p>
          )}
        </>
      ) : null}
    </Modal>
  );
}
