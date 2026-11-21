'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import CashAlerts from './CashAlerts';
import CashClosingForm, { type ClosingResult } from './CashClosingForm';
import CashClosingSummary from './CashClosingSummary';
import CashKpis from './CashKpis';
import CashMovementsTable from './CashMovementsTable';
import CashRegisterForm from './CashRegisterForm';
import {
  CASH_LIMIT,
  INITIAL_MOVEMENTS,
  LOCATION_CODE,
  OPENING_FLOAT,
  balanceOf,
  newMovement,
  type CashMovement,
} from './cash-model';

export default function CashDrawerPage() {
  const [movements, setMovements] = useState<CashMovement[]>(INITIAL_MOVEMENTS);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<ClosingResult | null>(null);
  const balance = balanceOf(movements);

  const add = (movement: CashMovement): void => {
    setMovements((current) => [movement, ...current]);
    setError(null);
    setSuccess('Рух готівки успішно зареєстровано в касі');
  };

  const collect = (): void => {
    const amount = balance - OPENING_FLOAT;
    add({
      ...newMovement('collection', amount, 'Інкасація готівки в сейф/банк'),
      author: 'Старший адміністратор',
    });
    setSuccess(`Інкасація успішно проведена на суму ${amount} ₴`);
  };

  const close = (result: ClosingResult): void => {
    setClosing(result);
    setError(null);
    setSuccess(
      result.discrepancy === 0
        ? 'Зміну закрито успішно без розбіжностей!'
        : `Зміну закрито з розбіжністю: ${result.discrepancy} ₴ (зафіксовано в аудиті)`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Каса та розрахунки (Cash Drawer & Reconciliation)"
        description="Керування розмінним фондом, рухами готівки, лімітами інкасації та денною звіркою (T-4530)."
      />
      <CashAlerts success={success} error={error} balance={balance} />
      <CashKpis movements={movements} closed={closing !== null} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashRegisterForm
          balance={balance}
          openingFloat={OPENING_FLOAT}
          overLimit={balance > CASH_LIMIT}
          onAdd={add}
          onCollect={collect}
          onError={setError}
        />
        <div className="rounded-card border border-line p-6 bg-surface-raised space-y-4">
          <CashClosingForm balance={balance} onClose={close} onError={setError} />
          {closing ? <CashClosingSummary result={closing} /> : null}
        </div>
      </div>
      <CashMovementsTable movements={movements} locationCode={LOCATION_CODE} />
    </div>
  );
}
