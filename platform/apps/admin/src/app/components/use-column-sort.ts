'use client';

// Спільне сортування таблиць адмінки (LOC-гейт ADR 0019: логіка окремо від
// розмітки). Стан — по колонці: перший клік asc, повторний — desc.
import { useState } from 'react';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: string;
  dir: SortDir;
}

/** Стан сортування + перемикач: інша колонка — asc, та сама — напрям. */
export function useColumnSort(initial: SortState): {
  sort: SortState;
  onSort: (key: string) => void;
} {
  const [sort, setSort] = useState<SortState>(initial);
  const onSort = (key: string) =>
    setSort((current) => ({
      key,
      dir: current.key === key && current.dir === 'asc' ? 'desc' : 'asc',
    }));
  return { sort, onSort };
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'uk');
}

/** Сортування копії списку; порожні значення (null/undefined) — наприкінці. */
export function sortRows<T>(rows: T[], sort: SortState, value: (row: T) => unknown): T[] {
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = value(a);
    const bv = value(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return factor * compareValues(av, bv);
  });
}
