import { balanceOf, CASH_LIMIT, OPENING_FLOAT, type CashMovement } from './cash-model';

export default function CashKpis({
  movements,
  closed,
}: {
  movements: CashMovement[];
  closed: boolean;
}) {
  const balance = balanceOf(movements);
  const kpis = [
    { label: 'Розмінний фонд', value: `${OPENING_FLOAT} ₴`, tone: 'text-fg' },
    { label: 'Поточний баланс готівки', value: `${balance} ₴`, tone: 'text-semantic-success' },
    { label: 'Ліміт інкасації', value: `${CASH_LIMIT} ₴`, tone: 'text-fg' },
    { label: 'Статус зміни', value: closed ? 'Закрито' : 'Відкрито', tone: 'text-accent-blue' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-card border border-line p-4 bg-surface-base">
          <p className="text-caption text-fg-muted">{kpi.label}</p>
          <p className={`text-h3 font-bold mt-1 ${kpi.tone}`}>{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
