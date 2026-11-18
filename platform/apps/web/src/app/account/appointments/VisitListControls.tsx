'use client';

// Контроли списку візитів кабінету: фільтр по статусу (CabinetStatus) і
// порядок за датою. Картки, не таблиця — тому select, а не сортування колонок.
import type { CabinetStatus } from '@/lib/api/appointments';

export type VisitStatusFilter = 'all' | CabinetStatus;
export type VisitSortOrder = 'asc' | 'desc';

const STATUS_OPTIONS: { value: VisitStatusFilter; label: string }[] = [
  { value: 'all', label: 'Усі статуси' },
  { value: 'upcoming', label: 'Очікується' },
  { value: 'confirmed', label: 'Підтверджено' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Скасовано' },
];

const ORDER_OPTIONS: { value: VisitSortOrder; label: string }[] = [
  { value: 'desc', label: 'Спочатку новіші' },
  { value: 'asc', label: 'Спочатку старіші' },
];

const SELECT = 'rounded-input border border-line bg-surface-base px-3 py-2 text-body';

export function VisitListControls({
  status,
  order,
  onStatusChange,
  onOrderChange,
  shown,
}: {
  status: VisitStatusFilter;
  order: VisitSortOrder;
  onStatusChange: (status: VisitStatusFilter) => void;
  onOrderChange: (order: VisitSortOrder) => void;
  shown: number;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3" aria-label="Фільтри списку візитів">
      <label>
        Статус
        {/* prettier-ignore */}
        <select value={status} onChange={(event) => onStatusChange(event.target.value as VisitStatusFilter)} className={`${SELECT} mt-1 block`}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Сортування
        {/* prettier-ignore */}
        <select value={order} onChange={(event) => onOrderChange(event.target.value as VisitSortOrder)} className={`${SELECT} mt-1 block`}>
          {ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-body-s text-fg-secondary pb-2">Показано: {shown}</p>
    </div>
  );
}
