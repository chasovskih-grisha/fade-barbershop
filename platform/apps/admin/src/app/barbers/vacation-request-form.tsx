'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@fade/ui';

type RequestVacation = (start: string, end: string, reason: string) => Promise<boolean>;

const INPUT_CLASS = 'mt-1 w-full rounded-input border border-line bg-surface-base p-2 text-body';

export default function VacationRequestForm({
  submitting,
  requestVacation,
}: {
  submitting: boolean;
  requestVacation: RequestVacation;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!startDate || !endDate) {
      setFormError('Оберіть дати початку та закінчення відпустки');
      return;
    }
    setFormError('');
    setSuccess('');
    if (await requestVacation(startDate, endDate, reason || 'Відпустка')) {
      setStartDate('');
      setEndDate('');
      setReason('');
      setSuccess('Запит на відпустку успішно надіслано');
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-caption">
          Дата початку
          <input
            type="date"
            aria-label="Дата початку відпустки"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="block text-caption">
          Дата закінчення
          <input
            type="date"
            aria-label="Дата закінчення відпустки"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
      </div>
      <label className="block text-caption">
        Причина / Коментар
        <input
          type="text"
          aria-label="Причина відпустки"
          placeholder="Наприклад: Щорічна відпустка"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={INPUT_CLASS}
        />
      </label>
      <Button variant="secondary" size="md" type="submit" disabled={submitting}>
        {submitting ? 'Надсилання...' : 'Надіслати запит на відпустку'}
      </Button>
      {formError ? (
        <p role="alert" className="text-semantic-danger text-caption">
          {formError}
        </p>
      ) : null}
      {success ? <p className="text-semantic-success text-caption">{success}</p> : null}
    </form>
  );
}
