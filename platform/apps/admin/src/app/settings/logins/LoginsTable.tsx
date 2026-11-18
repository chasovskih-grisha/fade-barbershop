// Таблиця журналу входів (T-4411 UI + owner-подання): час, логін, результат,
// опційно — чий запис (колонка «Адмін» у поданні «Усі адміністратори»).
// Відокремлено від сторінки за LOC-гейтом (ADR 0019). Фільтр результату і
// сортування по колонках — клієнтські, по завантаженому журналі.
'use client';

import { useState } from 'react';
import { Badge } from '@fade/ui';
import { SortableTh } from '../../components/SortableTh';
import { FilterSelect } from '../../components/FilterSelect';
import { useColumnSort, sortRows } from '../../components/use-column-sort';

export interface LoginEntry {
  ts: string;
  username: string;
  ok: boolean;
}

/** Короткий показ userId: перші 8 символів uuid — достатньо для розрізнення. */
export function shortUserId(userId: string): string {
  return userId.slice(0, 8);
}

/** Час закладу: DD.MM.YYYY HH:mm у Europe/Kyiv, незалежно від поясу браузера. */
export function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')} ${get('hour')}:${get('minute')}`;
}

/** Рядок може нести userId (owner-подання) або нести тільки власний журнал. */
export type LoginRow = LoginEntry & { userId?: string };

const RESULT_OPTIONS = [
  { value: 'all', label: 'Усі' },
  { value: 'ok', label: 'Успішні' },
  { value: 'fail', label: 'Невдалі' },
];

export default function LoginsTable({
  entries,
  showAdmin = false,
}: {
  entries: LoginRow[];
  showAdmin?: boolean;
}) {
  const { sort, onSort } = useColumnSort({ key: 'ts', dir: 'desc' });
  const [result, setResult] = useState('all');

  const VALUE: Record<string, (entry: LoginRow) => unknown> = {
    ts: (entry) => entry.ts,
    username: (entry) => entry.username,
    admin: (entry) => entry.userId,
    result: (entry) => (entry.ok ? 0 : 1),
  };
  const filtered = entries.filter((entry) => result === 'all' || (result === 'ok') === entry.ok);
  const rows = sortRows(filtered, sort, (entry) => VALUE[sort.key]?.(entry));

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <FilterSelect
          label="Результат"
          value={result}
          options={RESULT_OPTIONS}
          onChange={setResult}
        />
        <p className="text-body text-fg-secondary">Показано: {rows.length}</p>
      </div>
      <table className="w-full border-collapse text-body" aria-label="Журнал входів">
        <thead>
          <tr className="border-b border-line text-left text-fg-secondary">
            <SortableTh column="ts" label="Час" sort={sort} onSort={onSort} />
            <SortableTh column="username" label="Логін" sort={sort} onSort={onSort} />
            {showAdmin && <SortableTh column="admin" label="Адмін" sort={sort} onSort={onSort} />}
            <SortableTh column="result" label="Результат" sort={sort} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, index) => (
            <tr key={`${entry.ts}-${index}`} className="border-b border-line">
              <td className="py-2 pr-3">{formatTimestamp(entry.ts)}</td>
              <td className="py-2 pr-3">{entry.username}</td>
              {showAdmin && entry.userId !== undefined && (
                <td className="py-2 pr-3 font-mono text-caption" title={entry.userId}>
                  {shortUserId(entry.userId)}
                </td>
              )}
              <td className="py-2">
                {entry.ok ? (
                  <Badge tone="success">Успішно</Badge>
                ) : (
                  <Badge tone="danger">Невдача</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
