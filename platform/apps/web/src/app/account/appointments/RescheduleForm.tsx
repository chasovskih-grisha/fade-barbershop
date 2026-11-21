'use client';

import { useState } from 'react';
import { AlertBanner, Button, Field } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { rescheduleSlot } from './visit-time';

const fieldClass =
  'h-11 rounded-input border border-border bg-surface-base px-3 font-text text-body text-fg focus:outline-none focus:ring-1 focus:ring-fg';

export function RescheduleForm({
  visit,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  visit: ExtendedAppointment;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (when: { date: string; start: string; end: string }) => void;
}) {
  const [date, setDate] = useState(visit.date);
  const [start, setStart] = useState(visit.startTime);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    if (!visit.endTime) {
      setLocalError('Невідома тривалість візиту, перенести його не можна.');
      return;
    }
    const when = rescheduleSlot(visit, date, start);
    if (!when) {
      setLocalError('Цей час не вміщується в один день. Оберіть інший початок.');
      return;
    }
    onConfirm(when);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-fg-secondary">
        Оберіть новий час для послуги <strong className="text-fg">{visit.serviceName}</strong> у
        майстра <strong className="text-fg">{visit.barberName}</strong>. Тривалість візиту
        зберігається автоматично.
      </p>
      <div className="flex flex-col gap-3">
        <Field id="reschedule-date" label="Дата">
          <input
            id="reschedule-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field id="reschedule-start" label="Початок">
          <input
            id="reschedule-start"
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>
      <AlertBanner tone="info" title="Правила перенесення">
        Депозит та налаштування запису автоматично переносяться на новий обраний слот.
      </AlertBanner>
      {localError || error ? <AlertBanner tone="error" title={localError ?? error ?? ''} /> : null}
      <div className="flex gap-3 justify-end pt-2 border-t border-border/60">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Скасувати
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Перенесення...' : 'Перенести'}
        </Button>
      </div>
    </div>
  );
}
