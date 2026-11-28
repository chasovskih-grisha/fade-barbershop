'use client';

// T-4616b: позначити барбера недоступним прямо з календаря. Без цієї форми
// ланцюг «барбер захворів → візити потребують рішення» не має входу в UI, хоч
// POST /admin/barbers/:barberId/unavailability існує й покритий тестами.
// Форма живе окремо від панелі конфліктів: панель ховається, коли список
// порожній, а позначити недоступність треба саме тоді.
import { useState } from 'react';
import { Button, Card } from '@fade/ui';
import {
  UnavailabilityFields,
  type UnavailabilityDraft,
  type UnavailabilityOption,
} from './BarberUnavailabilityFields';

const EMPTY: UnavailabilityDraft = { barberId: '', locationId: '', start: '', end: '', reason: '' };

export interface BarberUnavailabilityFormProps {
  barbers: UnavailabilityOption[];
  locations: UnavailabilityOption[];
  /** Візити в інтервалі могли стати конфліктами — нехай панель перечитає. */
  onCreated?: () => void;
}

function toIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function BarberUnavailabilityForm({
  barbers,
  locations,
  onCreated,
}: BarberUnavailabilityFormProps) {
  const [draft, setDraft] = useState<UnavailabilityDraft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const startIso = toIso(draft.start);
  const endIso = toIso(draft.end);
  const canSubmit = Boolean(draft.barberId && startIso && endIso) && !busy;

  async function submit() {
    if (!draft.barberId || !startIso || !endIso) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/admin/barbers/${encodeURIComponent(draft.barberId)}/unavailability`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...(draft.locationId ? { locationId: draft.locationId } : {}),
          start: startIso,
          end: endIso,
          ...(draft.reason.trim() ? { reason: draft.reason.trim() } : {}),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = ((await res.json()) as { conflictsCreated?: number }).conflictsCreated ?? 0;
      setNotice(
        created > 0
          ? `Барбера позначено недоступним; візитів на рішення: ${created}`
          : 'Барбера позначено недоступним; візитів у цьому інтервалі немає'
      );
      setDraft({ ...EMPTY, barberId: draft.barberId, locationId: draft.locationId });
      onCreated?.();
    } catch {
      setNotice('Не вдалося позначити недоступність — спробуйте ще раз');
    } finally {
      setBusy(false);
    }
  }

  if (barbers.length === 0) return null;

  return (
    <Card className="mb-4 p-5">
      <h2 className="mb-3 text-bodyLg font-semibold">Барбер недоступний</h2>
      <div className="flex flex-wrap items-end gap-2 text-sm">
        <UnavailabilityFields
          value={draft}
          barbers={barbers}
          locations={locations}
          onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        />
        <Button variant="primary" size="md" disabled={!canSubmit} onClick={() => void submit()}>
          Позначити
        </Button>
      </div>
      {notice && <p className="mt-2 text-sm">{notice}</p>}
    </Card>
  );
}
