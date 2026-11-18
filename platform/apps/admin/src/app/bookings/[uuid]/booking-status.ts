// Статус візиту для StatusPill: API віддає доменний рядок статусу, а
// StatusPill падає на статусі поза словником (у БД статус — String, не enum).
// Невідомий код показуємо як є, підпис лишається українським.
'use client';

import type { VisitStatus } from '@fade/ui';

const KNOWN: VisitStatus[] = [
  'booked',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'waitlist_hold',
];

const isKnown = (status: string) => KNOWN.includes(status as VisitStatus);

/** Статус для компонента: невідомий код показуємо як «заброньовано». */
export function visitStatus(status: string): VisitStatus {
  return isKnown(status) ? (status as VisitStatus) : 'booked';
}

/** Підпис для StatusPill: відомий — словник компонента, невідомий — сам код. */
export function statusPillLabel(status: string): string | undefined {
  return isKnown(status) ? undefined : status;
}
