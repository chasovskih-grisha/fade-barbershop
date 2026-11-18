'use client';

import { useCallback, useState } from 'react';
import { Card, Button } from '@fade/ui';
import { BirthdayFields } from './BirthdayFields';
import { formatBirthday, type Birthday } from './birthday';

function same(a: Birthday | null, b: Birthday | null): boolean {
  return a?.day === b?.day && a?.month === b?.month;
}

/** Картка дня народження (T-4730b): день і місяць, без року; «Очистити» прибирає. */
export function AccountBirthdayCard({
  initial,
  token,
  onSaved,
}: {
  initial: Birthday | null;
  token: string | null;
  onSaved?: (next: Birthday | null) => void;
}) {
  const [saved, setSaved] = useState<Birthday | null>(initial);
  const [day, setDay] = useState(initial?.day ?? 0);
  const [month, setMonth] = useState(initial?.month ?? 0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const draft: Birthday | null = day > 0 && month > 0 ? { day, month } : null;
  const dirty = !same(draft, saved);

  const persist = useCallback(
    async (next: Birthday | null) => {
      setStatus('saving');
      try {
        const res = await fetch('/api/account/birthday', {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ birthday: next }),
        });
        if (!res.ok) throw new Error('Failed to save');
        setSaved(next);
        setDay(next?.day ?? 0);
        setMonth(next?.month ?? 0);
        onSaved?.(next);
        setStatus('idle');
      } catch {
        setStatus('error');
      }
    },
    [token, onSaved]
  );

  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="font-display text-display">День народження</h2>
      <p className="text-body-s text-fg-muted">
        {saved ? formatBirthday(saved) : 'Дату не вказано'}
      </p>
      <BirthdayFields day={day} month={month} onDay={setDay} onMonth={setMonth} />
      {status === 'error' && (
        <p role="alert" className="text-body-s text-danger">
          Не вдалося зберегти
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="md"
          onClick={() => persist(draft)}
          disabled={!dirty || status === 'saving'}
          className="w-fit"
        >
          Зберегти дату
        </Button>
        <Button
          size="md"
          variant="secondary"
          onClick={() => persist(null)}
          disabled={saved === null || status === 'saving'}
          className="w-fit"
        >
          Очистити
        </Button>
      </div>
    </Card>
  );
}
