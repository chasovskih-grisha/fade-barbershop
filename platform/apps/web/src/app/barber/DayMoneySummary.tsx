'use client';

import { useEffect, useState } from 'react';
import { Card, formatMoney } from '@fade/ui';
import { fetchBarberDayMoney, type BarberDayMoney } from '@/lib/api/barber-day-money';

/** Київська доба сьогодні — рядок, який чекає сервер. */
export function kyivToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * T-4404: скільки барбер узяв сьогодні і скільки лишилось винним. Дані — із
 * серверного зведення; поки їх немає, картка мовчить, а не показує нулі.
 */
export function DayMoneySummary() {
  const [money, setMoney] = useState<BarberDayMoney | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchBarberDayMoney(kyivToday()).then((value) => {
      if (alive) setMoney(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!money || (money.visits === 0 && money.collected === 0)) return null;

  return (
    <Card className="p-5">
      <h2 className="font-medium text-bodyLg mb-3">Гроші дня</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-body-s">
        <dt className="text-fg-secondary">Прийнято</dt>
        <dd className="text-right tabular-nums">{formatMoney(money.collected)}</dd>
        <dt className="text-fg-secondary">Готівка</dt>
        <dd className="text-right tabular-nums">{formatMoney(money.byForm.cash)}</dd>
        <dt className="text-fg-secondary">Термінал</dt>
        <dd className="text-right tabular-nums">{formatMoney(money.byForm.pos)}</dd>
        <dt className="text-fg-secondary">Картка</dt>
        <dd className="text-right tabular-nums">{formatMoney(money.byForm.card)}</dd>
        {money.outstanding > 0 && (
          <>
            <dt className="text-fg-secondary">Лишилось отримати</dt>
            <dd className="text-right tabular-nums">{formatMoney(money.outstanding)}</dd>
          </>
        )}
      </dl>
      <p className="mt-2 text-body-s text-fg-secondary">
        Завершених візитів: {money.completed} із {money.visits}
      </p>
    </Card>
  );
}
