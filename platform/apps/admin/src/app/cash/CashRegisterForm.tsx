'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';
import { newMovement, type CashMovement } from './cash-model';

interface CashRegisterFormProps {
  balance: number;
  openingFloat: number;
  overLimit: boolean;
  onAdd: (movement: CashMovement) => void;
  onCollect: () => void;
  onError: (message: string) => void;
}

export default function CashRegisterForm({
  balance,
  openingFloat,
  overLimit,
  onAdd,
  onCollect,
  onError,
}: CashRegisterFormProps) {
  const [type, setType] = useState<CashMovement['type']>('payment_on_site');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || amount.trim() === '') {
      onError('Введіть коректну суму руху готівки');
      return;
    }
    onAdd(newMovement(type, value, reason));
    setAmount('');
    setReason('');
  };

  const collect = (): void => {
    if (balance - openingFloat <= 0) {
      onError('Немає перевищення розмінного фонду для інкасації');
      return;
    }
    onCollect();
  };

  return (
    <div className="rounded-card border border-line p-6 bg-surface-raised space-y-4">
      <h3 className="font-display text-h4 font-bold">Зареєструвати рух готівки</h3>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-caption text-fg-muted mb-1">Тип операції</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as CashMovement['type'])}
            className="w-full rounded-input border border-line bg-surface-base p-2 text-body"
          >
            <option value="payment_on_site">Оплата на місці (Cash)</option>
            <option value="change_fund">Додати розмін (Change Fund)</option>
            <option value="refund">Повернення готівкою (Refund)</option>
            <option value="withdrawal">Вилучення з каси (Withdrawal)</option>
            <option value="collection">Інкасація (Collection)</option>
          </select>
        </div>
        <div>
          <label className="block text-caption text-fg-muted mb-1">Сума (₴)</label>
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="напр. 500"
            className="w-full rounded-input border border-line bg-surface-base p-2 text-body"
          />
        </div>
        <div>
          <label className="block text-caption text-fg-muted mb-1">Причина / Примітка</label>
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="напр. Оплата за стрижку / Розмін"
            className="w-full rounded-input border border-line bg-surface-base p-2 text-body"
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" variant="primary">
            Додати рух
          </Button>
          {overLimit ? (
            <Button type="button" variant="secondary" onClick={collect}>
              Провести інкасацію надлишку
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
