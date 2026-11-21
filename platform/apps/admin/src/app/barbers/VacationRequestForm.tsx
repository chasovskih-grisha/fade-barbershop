'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';

type RequestVacation = (start: string, end: string, reason: string) => Promise<boolean>;

export default function VacationRequestForm({
  saving,
  requestVacation,
  onResult,
}: {
  saving: boolean | undefined;
  requestVacation: RequestVacation;
  onResult: (ok: boolean, message: string) => void;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!startDate || !endDate) {
      onResult(false, 'Будь ласка, вкажіть дати початку та закінчення відпустки');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      onResult(false, 'Дата початку не може бути пізнішою за дату закінчення');
      return;
    }
    const ok = await requestVacation(
      startDate,
      endDate,
      reason || 'Відпустка / Особисті обставини'
    );
    if (ok) {
      setStartDate('');
      setEndDate('');
      setReason('');
    }
    onResult(
      ok,
      ok
        ? 'Заявку на відпустку успішно створено та надіслано на затвердження'
        : 'Не вдалося створити заявку на відпустку'
    );
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="space-y-3 p-3 rounded-card bg-surface-raised border border-line"
    >
      <h5 className="font-display text-fg-secondary font-semibold">
        Нова заявка на відпустку / лікарняний
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block text-caption">
          Дата початку
          <input
            type="date"
            aria-label="Дата початку відпустки"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-1 w-full rounded-input border border-line bg-surface-base p-2 text-body text-fg"
          />
        </label>
        <label className="block text-caption">
          Дата закінчення
          <input
            type="date"
            aria-label="Дата закінчення відпустки"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-1 w-full rounded-input border border-line bg-surface-base p-2 text-body text-fg"
          />
        </label>
        <label className="block text-caption">
          Причина / Коментар
          <input
            type="text"
            aria-label="Причина відпустки"
            placeholder="Напр. Щорічна відпустка"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 w-full rounded-input border border-line bg-surface-base p-2 text-body text-fg"
          />
        </label>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Button variant="secondary" size="md" type="submit" disabled={saving}>
          {saving ? 'Надсилання...' : 'Подати заявку'}
        </Button>
      </div>
    </form>
  );
}
