export interface CashMovement {
  id: string;
  type: 'payment_on_site' | 'refund' | 'change_fund' | 'withdrawal' | 'collection';
  amount: number;
  author: string;
  timestamp: string;
  reason: string;
}

export const LOCATION_CODE = 'LVIV-01';
export const OPENING_FLOAT = 2000;
export const CASH_LIMIT = 10000;

export const INITIAL_MOVEMENTS: CashMovement[] = [
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
];

const OUTFLOW_TYPES: CashMovement['type'][] = ['refund', 'withdrawal', 'collection'];

export function isOutflow(type: CashMovement['type']): boolean {
  return OUTFLOW_TYPES.includes(type);
}

export function balanceOf(movements: CashMovement[]): number {
  return movements.reduce(
    (balance, movement) =>
      isOutflow(movement.type) ? balance - movement.amount : balance + movement.amount,
    OPENING_FLOAT
  );
}

export function newMovement(
  type: CashMovement['type'],
  amount: number,
  reason: string
): CashMovement {
  return {
    id: `mov-${Date.now()}`,
    type,
    amount,
    author: 'Адмін / Барбер',
    timestamp: new Date().toISOString(),
    reason: reason || 'Операція з касою',
  };
}
