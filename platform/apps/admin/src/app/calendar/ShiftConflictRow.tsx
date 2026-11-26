'use client';

// Рядок конфлікту (T-4616b): час, клієнт, послуга і дві дії засновника.
// Тип рядка живе тут, поруч із компонентом, який його малює: панель імпортує
// його звідси, тож циклу «панель ↔ рядок» немає. Вибір барбера — стан рядка:
// панелі він не потрібен, а інакше вона тримала б мапу id → барбер.
import { useState } from 'react';
import { Button } from '@fade/ui';

export interface ShiftConflictRow {
  id: string;
  appointmentId: string;
  barberId: string;
  start: string;
  end: string;
  clientName?: string | null;
  serviceName?: string | null;
}

export interface ReassignSlot {
  barberId: string;
  date: string;
  start: string;
  end: string;
}

export function timeOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function localIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function ConflictRowItem({
  row,
  busy,
  onCancel,
  onReassign,
}: {
  row: ShiftConflictRow;
  busy: boolean;
  onCancel: () => void;
  onReassign: (slot: ReassignSlot) => void;
}) {
  const [barberId, setBarberId] = useState('');
  const start = timeOf(row.start);
  const end = timeOf(row.end);
  const date = localIsoDate(new Date(row.start));
  return (
    <li className="rounded border border-border p-3 text-sm">
      <p className="font-medium">
        {start}–{end} · {row.clientName ?? 'Клієнт'} · {row.serviceName ?? 'Послуга'}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="md" disabled={busy} onClick={onCancel}>
          Скасувати візит
        </Button>
        <label className="flex items-center gap-1">
          Барбер
          <input
            aria-label={`Барбер для ${row.id}`}
            className="w-32 rounded border border-border px-2 py-1"
            value={barberId}
            onChange={(event) => setBarberId(event.target.value)}
          />
        </label>
        <Button
          variant="primary"
          size="md"
          disabled={busy || !barberId}
          onClick={() => onReassign({ barberId, date, start, end })}
        >
          Перенести
        </Button>
      </div>
    </li>
  );
}
