import type { ClosingResult } from './CashClosingForm';

export default function CashClosingSummary({ result }: { result: ClosingResult }) {
  return (
    <div className="mt-4 p-3 rounded-input bg-surface-base border border-line space-y-1">
      <p className="text-body font-semibold">Результат звірки:</p>
      <p className="text-caption">
        Очікувалося: {result.expected} ₴ | Фактично: {result.actual} ₴
      </p>
      <p
        className={`text-caption font-bold ${result.discrepancy === 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}
      >
        Розбіжність: {result.discrepancy} ₴
      </p>
    </div>
  );
}
