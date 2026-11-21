'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';

export interface ClosingResult {
  expected: number;
  actual: number;
  discrepancy: number;
  closedAt: string;
}

export default function CashClosingForm({
  balance,
  onClose,
  onError,
}: {
  balance: number;
  onClose: (result: ClosingResult) => void;
  onError: (message: string) => void;
}) {
  const [actualCount, setActualCount] = useState('');

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const actual = Number(actualCount);
    if (actualCount.trim() === '' || !Number.isFinite(actual)) {
      onError('Введіть фактичний перерахунок каси');
      return;
    }
    onClose({
      expected: balance,
      actual,
      discrepancy: actual - balance,
      closedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="rounded-card border border-line p-6 bg-surface-raised space-y-4">
      <h3 className="font-display text-h4 font-bold">Денна звірка та закриття зміни</h3>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-caption text-fg-muted mb-1">
            Очікуваний баланс в системі
          </label>
          <p className="text-h4 font-bold text-fg">{balance} ₴</p>
        </div>
        <div>
          <label className="block text-caption text-fg-muted mb-1">
            Фактичний перерахунок готівки (Факт)
          </label>
          <input
            type="number"
            value={actualCount}
            onChange={(event) => setActualCount(event.target.value)}
            placeholder="напр. 2850"
            className="w-full rounded-input border border-line bg-surface-base p-2 text-body"
          />
        </div>
        <Button type="submit" variant="primary">
          Закрити зміну та звірити касу
        </Button>
      </form>
    </div>
  );
}
