'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@fade/ui';
import { HoursDayRow, DAY_NAMES } from './HoursDayRow';

export interface DayHours {
  dayOfWeek: number;
  open: string | null;
  close: string | null;
  closed: boolean;
}
export interface LocationSummary {
  id: string;
  code: string;
  name: string;
  address: string;
  hours: DayHours[];
}

export default function HoursEditor({
  location,
  onCancel,
  onSaved,
}: {
  location: LocationSummary;
  onCancel: () => void;
  onSaved: (hours: DayHours[]) => void;
}) {
  const [hours, setHours] = useState(() =>
    [...location.hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const changeDay = (dayOfWeek: number, changes: Partial<DayHours>) => {
    setHours((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day))
    );
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    // prettier-ignore
    const invalidDay = hours.find((day) => !day.closed && (!day.open || !day.close || day.open >= day.close));
    if (invalidDay) {
      setError(
        `${DAY_NAMES[invalidDay.dayOfWeek]}: час відкриття має бути раніше за час закриття.`
      );
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/admin/locations/${location.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ hours }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Не вдалося зберегти години роботи.');
      }
      onSaved(hours);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти години роботи.');
    } finally {
      setSaving(false);
    }
  };

  return (
    // prettier-ignore
    <section aria-labelledby="hours-title" className="mt-6 rounded-card border border-line bg-surface-raised p-5">
      <h2 id="hours-title" className="mb-4 font-display text-h4">
        Години роботи · {location.name}
      </h2>
      <form onSubmit={save}>
        <div className="space-y-3">
          {hours.map((day) => (
            <HoursDayRow key={day.dayOfWeek} day={day} onChange={changeDay} />
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-4 text-semantic-danger">{error}</p>
        )}
        <div className="mt-5 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Збереження…' : 'Зберегти години'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Скасувати
          </Button>
        </div>
      </form>
    </section>
  );
}
