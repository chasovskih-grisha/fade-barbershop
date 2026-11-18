'use client';

import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { Button, AlertBanner } from '@fade/ui';

interface CashMovement {
  id: string;
  type: 'payment_on_site' | 'refund' | 'change_fund' | 'withdrawal' | 'collection';
  amount: number;
  author: string;
  timestamp: string;
  reason: string;
}

export default function CashDrawerPage() {
  const [locationCode] = useState('LVIV-01');
  const [openingFloat] = useState(2000);
  const [cashLimit] = useState(10000);
  const [movements, setMovements] = useState<CashMovement[]>([
    {
      id: 'mov-1',
      type: 'payment_on_site',
      amount: 850,
      author: 'Тарас Барбер',
      timestamp: '2026-11-12T10:15:00Z',
      reason: 'Стрижка + борода (готівка)',
    },
    {
      id: 'mov-2',
      type: 'change_fund',
      amount: 200,
      author: 'Адмін Олена',
      timestamp: '2026-11-12T09:00:00Z',
      reason: 'Розмін дрібних купюр',
    },
  ]);

  const [newType, setNewType] = useState<CashMovement['type']>('payment_on_site');
  const [newAmount, setNewAmount] = useState('');
  const [newReason, setNewReason] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Closing state
  const [actualCount, setActualCount] = useState('');
  const [closingResult, setClosingResult] = useState<{ expected: number; actual: number; discrepancy: number; closedAt: string } | null>(null);

  // Computed balance
  const totalIn = movements
    .filter((m) => m.type === 'payment_on_site' || m.type === 'change_fund')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalOut = movements
    .filter((m) => m.type === 'refund' || m.type === 'withdrawal' || m.type === 'collection')
    .reduce((sum, m) => sum + m.amount, 0);

  const currentBalance = openingFloat + totalIn - totalOut;
  const isOverLimit = currentBalance > cashLimit;

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Введіть коректну суму руху готівки');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    const movement: CashMovement = {
      id: `mov-${Date.now()}`,
      type: newType,
      amount: amt,
      author: 'Адмін / Барбер',
      timestamp: new Date().toISOString(),
      reason: newReason || 'Операція з касою',
    };

    setMovements([movement, ...movements]);
    setNewAmount('');
    setNewReason('');
    setSuccessMsg('Рух готівки успішно зареєстровано в касі');
  };

  const handleCollection = () => {
    const collectionAmount = currentBalance - openingFloat;
    if (collectionAmount <= 0) {
      setErrorMsg('Немає перевищення розмінного фонду для інкасації');
      return;
    }
    const movement: CashMovement = {
      id: `mov-${Date.now()}`,
      type: 'collection',
      amount: collectionAmount,
      author: 'Старший адміністратор',
      timestamp: new Date().toISOString(),
      reason: 'Інкасація готівки в сейф/банк',
    };
    setMovements([movement, ...movements]);
    setSuccessMsg(`Інкасація успішно проведена на суму ${collectionAmount} ₴`);
    setErrorMsg(null);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCount);
    if (isNaN(actual)) {
      setErrorMsg('Введіть фактичний перерахунок каси');
      return;
    }
    const discrepancy = actual - currentBalance;
    setClosingResult({
      expected: currentBalance,
      actual,
      discrepancy,
      closedAt: new Date().toISOString(),
    });
    setSuccessMsg(discrepancy === 0 ? 'Зміну закрито успішно без розбіжностей!' : `Зміну закрито з розбіжністю: ${discrepancy} ₴ (зафіксовано в аудиті)`);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Каса та розрахунки (Cash Drawer & Reconciliation)"
        description="Керування розмінним фондом, рухами готівки, лімітами інкасації та денною звіркою (T-4530)."
      />

      {successMsg && <AlertBanner tone="success" title="Успішно" description={successMsg} />}
      {errorMsg && <AlertBanner tone="error" title="Помилка" description={errorMsg} />}

      {isOverLimit && (
        <AlertBanner
          tone="warning"
          title="Увага: Перевищення ліміту"
          description={`Готівка в касі (${currentBalance} ₴) перевищує ліміт інкасації (${cashLimit} ₴). Рекомендується провести інкасацію.`}
        />
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-card border border-line p-4 bg-surface-base">
          <p className="text-caption text-fg-muted">Розмінний фонд</p>
          <p className="text-h3 font-bold mt-1 text-fg">{openingFloat} ₴</p>
        </div>
        <div className="rounded-card border border-line p-4 bg-surface-base">
          <p className="text-caption text-fg-muted">Поточний баланс готівки</p>
          <p className="text-h3 font-bold mt-1 text-semantic-success">{currentBalance} ₴</p>
        </div>
        <div className="rounded-card border border-line p-4 bg-surface-base">
          <p className="text-caption text-fg-muted">Ліміт інкасації</p>
          <p className="text-h3 font-bold mt-1 text-fg">{cashLimit} ₴</p>
        </div>
        <div className="rounded-card border border-line p-4 bg-surface-base">
          <p className="text-caption text-fg-muted">Статус зміни</p>
          <p className="text-h3 font-bold mt-1 text-accent-blue">{closingResult ? 'Закрито' : 'Відкрито'}</p>
        </div>
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Register Cash Movement */}
        <div className="rounded-card border border-line p-6 bg-surface-raised space-y-4">
          <h3 className="font-display text-h4 font-bold">Зареєструвати рух готівки</h3>
          <form onSubmit={handleAddMovement} className="space-y-4">
            <div>
              <label className="block text-caption text-fg-muted mb-1">Тип операції</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CashMovement['type'])}
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
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="напр. 500"
                className="w-full rounded-input border border-line bg-surface-base p-2 text-body"
              />
            </div>

            <div>
              <label className="block text-caption text-fg-muted mb-1">Причина / Примітка</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="напр. Оплата за стрижку / Розмін"
                className="w-full rounded-input border border-line bg-surface-base p-2 text-body"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary">
                Додати рух
              </Button>
              {isOverLimit && (
                <Button type="button" variant="secondary" onClick={handleCollection}>
                  Провести інкасацію надлишку
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Daily Closing & Reconciliation */}
        <div className="rounded-card border border-line p-6 bg-surface-raised space-y-4">
          <h3 className="font-display text-h4 font-bold">Денна звірка та закриття зміни</h3>
          <form onSubmit={handleCloseShift} className="space-y-4">
            <div>
              <label className="block text-caption text-fg-muted mb-1">Очікуваний баланс в системі</label>
              <p className="text-h4 font-bold text-fg">{currentBalance} ₴</p>
            </div>

            <div>
              <label className="block text-caption text-fg-muted mb-1">Фактичний перерахунок готівки (Факт)</label>
              <input
                type="number"
                value={actualCount}
                onChange={(e) => setActualCount(e.target.value)}
                placeholder="напр. 2850"
                className="w-full rounded-input border border-line bg-surface-base p-2 text-body"
              />
            </div>

            <Button type="submit" variant="primary">
              Закрити зміну та звірити касу
            </Button>

            {closingResult && (
              <div className="mt-4 p-3 rounded-input bg-surface-base border border-line space-y-1">
                <p className="text-body font-semibold">Результат звірки:</p>
                <p className="text-caption">Очікувалося: {closingResult.expected} ₴ | Фактично: {closingResult.actual} ₴</p>
                <p className={`text-caption font-bold ${closingResult.discrepancy === 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                  Розбіжність: {closingResult.discrepancy} ₴
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Movements Table */}
      <div className="rounded-card border border-line bg-surface-raised overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h3 className="font-display text-h4 font-bold">Журнал рухів готівки по локації {locationCode}</h3>
          <span className="text-caption text-fg-muted">Всього записів: {movements.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-base text-caption text-fg-muted">
                <th className="p-3">Час</th>
                <th className="p-3">Тип</th>
                <th className="p-3">Сума</th>
                <th className="p-3">Автор</th>
                <th className="p-3">Причина</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-line/50 text-body">
                  <td className="p-3 text-caption text-fg-muted">{new Date(m.timestamp).toLocaleTimeString()}</td>
                  <td className="p-3 font-medium capitalize">{m.type.replace(/_/g, ' ')}</td>
                  <td className={`p-3 font-bold ${m.type === 'refund' || m.type === 'withdrawal' || m.type === 'collection' ? 'text-semantic-danger' : 'text-semantic-success'}`}>
                    {m.type === 'refund' || m.type === 'withdrawal' || m.type === 'collection' ? `-${m.amount}` : `+${m.amount}`} ₴
                  </td>
                  <td className="p-3">{m.author}</td>
                  <td className="p-3 text-fg-muted">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
